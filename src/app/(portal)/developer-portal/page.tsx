'use client';

import { useState, useMemo } from 'react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import {
  Code2,
  Plus,
  Search,
  X,
  Key,
  Webhook,
  Copy,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  status: 'active' | 'revoked' | 'expired';
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  requestCount: number;
}

interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'paused' | 'failing';
  successRate: number;
  lastTriggered: string | null;
  failCount: number;
  createdAt: string;
}

type Tab = 'api-keys' | 'webhooks' | 'documentation';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_API_KEYS: ApiKeyItem[] = [
  {
    id: '1',
    name: 'Production API Key',
    keyPrefix: 'ck_live_abc...def',
    status: 'active',
    scopes: ['read:events', 'write:events', 'read:units', 'read:residents'],
    createdAt: '2026-01-15T10:00:00Z',
    lastUsedAt: '2026-03-19T08:34:00Z',
    expiresAt: null,
    requestCount: 48203,
  },
  {
    id: '2',
    name: 'Staging Key',
    keyPrefix: 'ck_test_xyz...uvw',
    status: 'active',
    scopes: ['read:events', 'write:events'],
    createdAt: '2026-02-20T14:30:00Z',
    lastUsedAt: '2026-03-18T22:10:00Z',
    expiresAt: '2026-06-20T14:30:00Z',
    requestCount: 1247,
  },
  {
    id: '3',
    name: 'Webhook Signing Key',
    keyPrefix: 'whsec_mno...pqr',
    status: 'revoked',
    scopes: ['webhooks:sign'],
    createdAt: '2025-11-01T09:00:00Z',
    lastUsedAt: '2026-01-10T16:45:00Z',
    expiresAt: null,
    requestCount: 9821,
  },
];

const MOCK_WEBHOOKS: WebhookItem[] = [
  {
    id: '1',
    url: 'https://api.example.com/webhooks/packages',
    events: ['package.delivered', 'package.picked_up', 'package.expired'],
    status: 'active',
    successRate: 99.8,
    lastTriggered: '2026-03-19T08:12:00Z',
    failCount: 2,
    createdAt: '2026-01-20T11:00:00Z',
  },
  {
    id: '2',
    url: 'https://api.example.com/webhooks/maintenance',
    events: ['maintenance.created', 'maintenance.updated', 'maintenance.closed'],
    status: 'paused',
    successRate: 95.2,
    lastTriggered: '2026-03-15T14:30:00Z',
    failCount: 12,
    createdAt: '2026-02-05T09:00:00Z',
  },
  {
    id: '3',
    url: 'https://api.example.com/webhooks/visitors',
    events: ['visitor.signed_in', 'visitor.signed_out'],
    status: 'failing',
    successRate: 42.1,
    lastTriggered: '2026-03-19T07:55:00Z',
    failCount: 87,
    createdAt: '2026-02-28T16:00:00Z',
  },
];

interface DocCard {
  title: string;
  description: string;
  icon: 'code' | 'webhook' | 'key' | 'search';
}

const DOC_CARDS: DocCard[] = [
  {
    title: 'REST API Reference',
    description:
      'Complete reference for all API endpoints, request/response formats, and error codes.',
    icon: 'code',
  },
  {
    title: 'Webhook Events',
    description: 'Full list of webhook event types, payload schemas, and delivery guarantees.',
    icon: 'webhook',
  },
  {
    title: 'Authentication Guide',
    description: 'How to authenticate API requests, manage tokens, and handle key rotation.',
    icon: 'key',
  },
  {
    title: 'SDKs & Libraries',
    description: 'Official client libraries for Node.js, Python, Ruby, and more.',
    icon: 'search',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const statusBadgeVariant: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  active: 'success',
  revoked: 'error',
  expired: 'warning',
  paused: 'warning',
  failing: 'error',
};

const docIconMap = {
  code: Code2,
  webhook: Webhook,
  key: Key,
  search: Search,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DeveloperPortalPage() {
  const [activeTab, setActiveTab] = useState<Tab>('api-keys');
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());

  const { data: apiKeysData } = useApi<ApiKeyItem[]>(
    apiUrl('/api/v1/developer/api-keys', { propertyId: DEMO_PROPERTY_ID }),
  );
  const { data: webhooksData } = useApi<WebhookItem[]>(
    apiUrl('/api/v1/developer/webhooks', { propertyId: DEMO_PROPERTY_ID }),
  );

  const apiKeys = useMemo<ApiKeyItem[]>(() => apiKeysData ?? MOCK_API_KEYS, [apiKeysData]);
  const webhooks = useMemo<WebhookItem[]>(() => webhooksData ?? MOCK_WEBHOOKS, [webhooksData]);

  // Summary stats for API Keys
  const totalKeys = apiKeys.length;
  const activeKeys = apiKeys.filter((k) => k.status === 'active').length;
  const totalRequests = apiKeys.reduce((sum, k) => sum + k.requestCount, 0);

  function toggleKeyReveal(id: string) {
    setRevealedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // -------------------------------------------------------------------------
  // API Keys Columns
  // -------------------------------------------------------------------------

  const apiKeyColumns: Column<ApiKeyItem>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: (row) => <span className="font-semibold text-neutral-900">{row.name}</span>,
      sortable: true,
      accessorKey: 'name',
    },
    {
      id: 'key',
      header: 'Key',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <code className="rounded bg-neutral-100 px-2 py-0.5 font-mono text-[13px] text-neutral-700">
            {revealedKeys.has(row.id) ? row.keyPrefix.replace('...', '••••••••') : row.keyPrefix}
          </code>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleKeyReveal(row.id);
            }}
            className="text-neutral-400 transition-colors hover:text-neutral-600"
            title={revealedKeys.has(row.id) ? 'Hide key' : 'Reveal key'}
          >
            {revealedKeys.has(row.id) ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(row.keyPrefix);
            }}
            className="text-neutral-400 transition-colors hover:text-neutral-600"
            title="Copy key"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge variant={statusBadgeVariant[row.status]} size="sm" dot>
          {row.status}
        </Badge>
      ),
      sortable: true,
      accessorKey: 'status',
    },
    {
      id: 'scopes',
      header: 'Scopes',
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.scopes.map((scope) => (
            <Badge key={scope} variant="default" size="sm">
              {scope}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      id: 'createdAt',
      header: 'Created',
      cell: (row) => <span className="text-neutral-500">{formatDate(row.createdAt)}</span>,
      sortable: true,
      accessorKey: 'createdAt',
    },
    {
      id: 'lastUsedAt',
      header: 'Last Used',
      cell: (row) => <span className="text-neutral-500">{formatDateTime(row.lastUsedAt)}</span>,
      sortable: true,
      accessorKey: 'lastUsedAt',
    },
    {
      id: 'requestCount',
      header: 'Requests',
      cell: (row) => (
        <span className="font-medium text-neutral-900">{row.requestCount.toLocaleString()}</span>
      ),
      sortable: true,
      accessorKey: 'requestCount',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) =>
        row.status === 'active' ? (
          <Button variant="ghost" size="sm" className="text-error-600 hover:text-error-700">
            <Trash2 className="h-3.5 w-3.5" />
            Revoke
          </Button>
        ) : (
          <span className="text-[13px] text-neutral-400">--</span>
        ),
    },
  ];

  // -------------------------------------------------------------------------
  // Webhooks Columns
  // -------------------------------------------------------------------------

  const webhookColumns: Column<WebhookItem>[] = [
    {
      id: 'url',
      header: 'URL',
      cell: (row) => (
        <code className="block max-w-[280px] truncate rounded bg-neutral-100 px-2 py-0.5 font-mono text-[13px] text-neutral-700">
          {row.url}
        </code>
      ),
      sortable: true,
      accessorKey: 'url',
    },
    {
      id: 'events',
      header: 'Events',
      cell: (row) => (
        <Badge variant="info" size="sm">
          {row.events.length} event{row.events.length !== 1 ? 's' : ''}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge variant={statusBadgeVariant[row.status]} size="sm" dot>
          {row.status}
        </Badge>
      ),
      sortable: true,
      accessorKey: 'status',
    },
    {
      id: 'successRate',
      header: 'Success Rate',
      cell: (row) => (
        <span
          className={`font-medium ${
            row.successRate >= 95
              ? 'text-success-600'
              : row.successRate >= 70
                ? 'text-warning-600'
                : 'text-error-600'
          }`}
        >
          {row.successRate}%
        </span>
      ),
      sortable: true,
      accessorKey: 'successRate',
    },
    {
      id: 'lastTriggered',
      header: 'Last Triggered',
      cell: (row) => <span className="text-neutral-500">{formatDateTime(row.lastTriggered)}</span>,
      sortable: true,
      accessorKey: 'lastTriggered',
    },
    {
      id: 'failCount',
      header: 'Failures',
      cell: (row) => (
        <span className={row.failCount > 50 ? 'text-error-600 font-medium' : 'text-neutral-500'}>
          {row.failCount}
        </span>
      ),
      sortable: true,
      accessorKey: 'failCount',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1">
          {row.status !== 'paused' ? (
            <Button variant="ghost" size="sm">
              Pause
            </Button>
          ) : (
            <Button variant="ghost" size="sm">
              Resume
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-error-600 hover:text-error-700">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  // -------------------------------------------------------------------------
  // Tabs
  // -------------------------------------------------------------------------

  const tabs: { id: Tab; label: string; icon: typeof Code2 }[] = [
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook },
    { id: 'documentation', label: 'Documentation', icon: Code2 },
  ];

  return (
    <PageShell
      title="Developer Portal"
      description="Manage API keys, webhooks, and integration settings."
      actions={
        <>
          {activeTab === 'api-keys' && (
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Generate API Key
            </Button>
          )}
          {activeTab === 'webhooks' && (
            <Button size="sm">
              <Plus className="h-4 w-4" />
              Create Webhook
            </Button>
          )}
        </>
      }
    >
      {/* Tab Navigation */}
      <div className="mb-6 flex gap-1 rounded-xl border border-neutral-200/80 bg-neutral-50/80 p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[14px] font-medium transition-all ${
                isActive
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: API Keys */}
      {activeTab === 'api-keys' && (
        <div className="flex flex-col gap-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card padding="sm" className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                <Key className="h-5 w-5 text-neutral-600" />
              </div>
              <div>
                <p className="text-[24px] font-bold tracking-tight text-neutral-900">{totalKeys}</p>
                <p className="text-[13px] text-neutral-500">Total Keys</p>
              </div>
            </Card>
            <Card padding="sm" className="flex items-center gap-4">
              <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
                <CheckCircle2 className="text-success-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                  {activeKeys}
                </p>
                <p className="text-[13px] text-neutral-500">Active</p>
              </div>
            </Card>
            <Card padding="sm" className="flex items-center gap-4">
              <div className="bg-info-50 flex h-10 w-10 items-center justify-center rounded-xl">
                <Clock className="text-info-600 h-5 w-5" />
              </div>
              <div>
                <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                  {totalRequests.toLocaleString()}
                </p>
                <p className="text-[13px] text-neutral-500">Total Requests</p>
              </div>
            </Card>
          </div>

          {/* API Keys Table */}
          <DataTable<ApiKeyItem>
            columns={apiKeyColumns}
            data={apiKeys}
            emptyMessage="No API keys created yet."
            emptyIcon={<Key className="h-5 w-5" />}
          />
        </div>
      )}

      {/* Tab: Webhooks */}
      {activeTab === 'webhooks' && (
        <DataTable<WebhookItem>
          columns={webhookColumns}
          data={webhooks}
          emptyMessage="No webhooks configured yet."
          emptyIcon={<Webhook className="h-5 w-5" />}
        />
      )}

      {/* Tab: Documentation */}
      {activeTab === 'documentation' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {DOC_CARDS.map((doc) => {
            const Icon = docIconMap[doc.icon];
            return (
              <Card key={doc.title} hoverable className="cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className="bg-primary-50 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="text-primary-600 h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-neutral-900">{doc.title}</h3>
                    <p className="mt-1 text-[14px] leading-relaxed text-neutral-500">
                      {doc.description}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
