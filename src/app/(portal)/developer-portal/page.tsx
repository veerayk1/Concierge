'use client';

import { useState, useMemo, useCallback } from 'react';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import {
  Code2,
  Plus,
  Key,
  Webhook,
  Copy,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Loader2,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Search } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types (aligned with API responses)
// ---------------------------------------------------------------------------

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  status: string; // 'active' | 'revoked' | 'expired'
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
  status: string; // 'active' | 'paused' | 'failing'
  successRate: number;
  lastTriggered: string | null;
  failCount: number;
  createdAt: string;
}

type Tab = 'api-keys' | 'webhooks' | 'documentation';

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
// Create API Key Dialog
// ---------------------------------------------------------------------------

const AVAILABLE_SCOPES = [
  { value: 'read', label: 'Read', description: 'Read-only access to property data' },
  { value: 'write', label: 'Write', description: 'Create and update records' },
  { value: 'admin', label: 'Admin', description: 'Full administrative access' },
] as const;

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function CreateApiKeyDialog({ open, onOpenChange, onSuccess }: CreateApiKeyDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['read']);

  function toggleScope(scope: string) {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope],
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError(null);
    setCreatedKey(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const name = form.get('name') as string;

    if (!name.trim()) {
      setServerError('Name is required.');
      setSubmitting(false);
      return;
    }
    if (selectedScopes.length === 0) {
      setServerError('At least one scope is required.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await apiRequest('/api/v1/developer/api-keys', {
        method: 'POST',
        body: {
          propertyId: getPropertyId(),
          name: name.trim(),
          scopes: selectedScopes,
        },
      });
      const result = await res.json();

      if (!res.ok) {
        setServerError(result.message || 'Failed to create API key');
        return;
      }

      // Show the key — it will never be shown again
      setCreatedKey(result.data?.key || null);
      onSuccess();
    } catch {
      setServerError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setCreatedKey(null);
    setServerError(null);
    setSelectedScopes(['read']);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Key className="text-primary-500 h-5 w-5" />
          Generate API Key
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Create a new API key for programmatic access to this property&apos;s data.
        </DialogDescription>

        {createdKey ? (
          <div className="mt-4 flex flex-col gap-4">
            <div className="border-success-200 bg-success-50 rounded-xl border px-4 py-3">
              <p className="text-success-700 text-[14px] font-medium">
                API key created. Copy it now — it will not be shown again.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-lg bg-neutral-100 px-3 py-2 font-mono text-[13px] text-neutral-800">
                {createdKey}
              </code>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigator.clipboard.writeText(createdKey)}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={handleClose}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
            {serverError && (
              <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
                {serverError}
              </div>
            )}

            <Input name="name" label="Key Name" placeholder="e.g. Production API Key" required />

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Scopes<span className="text-error-500 ml-0.5">*</span>
              </label>
              <div className="flex flex-col gap-2">
                {AVAILABLE_SCOPES.map((scope) => (
                  <Checkbox
                    key={scope.value}
                    id={`scope-${scope.value}`}
                    checked={selectedScopes.includes(scope.value)}
                    onCheckedChange={() => toggleScope(scope.value)}
                    label={scope.label}
                    description={scope.description}
                  />
                ))}
              </div>
            </div>

            <div className="mt-2 flex items-center justify-end gap-3 border-t border-neutral-100 pt-5">
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Key'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DeveloperPortalPage() {
  const [activeTab, setActiveTab] = useState<Tab>('api-keys');
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());
  const [showCreateKeyDialog, setShowCreateKeyDialog] = useState(false);

  // Fetch API keys
  const {
    data: apiKeysRaw,
    loading: keysLoading,
    error: keysError,
    refetch: refetchKeys,
  } = useApi<ApiKeyItem[]>(apiUrl('/api/v1/developer/api-keys', { propertyId: getPropertyId() }));

  // Fetch webhooks
  const {
    data: webhooksRaw,
    loading: webhooksLoading,
    error: webhooksError,
    refetch: refetchWebhooks,
  } = useApi<WebhookItem[]>(apiUrl('/api/v1/developer/webhooks', { propertyId: getPropertyId() }));

  const apiKeys: ApiKeyItem[] = useMemo(() => {
    if (!apiKeysRaw) return [];
    return Array.isArray(apiKeysRaw) ? apiKeysRaw : [];
  }, [apiKeysRaw]);

  const webhooks: WebhookItem[] = useMemo(() => {
    if (!webhooksRaw) return [];
    return Array.isArray(webhooksRaw) ? webhooksRaw : [];
  }, [webhooksRaw]);

  const loading = keysLoading || webhooksLoading;
  const error = keysError || webhooksError;

  // Summary stats for API Keys
  const totalKeys = apiKeys.length;
  const activeKeys = apiKeys.filter((k) => k.status === 'active').length;
  const totalRequests = apiKeys.reduce((sum, k) => sum + (k.requestCount || 0), 0);

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
            {revealedKeys.has(row.id)
              ? (row.keyPrefix?.replace('...', '--------') ?? row.keyPrefix)
              : row.keyPrefix}
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
        <Badge variant={statusBadgeVariant[row.status] ?? 'default'} size="sm" dot>
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
          {(row.scopes ?? []).map((scope) => (
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
        <span className="font-medium text-neutral-900">
          {(row.requestCount || 0).toLocaleString()}
        </span>
      ),
      sortable: true,
      accessorKey: 'requestCount',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: (row) =>
        row.status === 'active' ? (
          <Button
            variant="ghost"
            size="sm"
            className="text-error-600 hover:text-error-700"
            onClick={async () => {
              if (!confirm(`Revoke API key "${row.name}"? This cannot be undone.`)) return;
              try {
                const res = await apiRequest(`/api/v1/developer/api-keys/${row.id}`, {
                  method: 'DELETE',
                });
                if (res.ok) {
                  refetchKeys();
                } else {
                  const result = await res.json().catch(() => ({}));
                  alert(result.message || 'Failed to revoke API key.');
                }
              } catch {
                alert('Network error. Please try again.');
              }
            }}
          >
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
          {(row.events ?? []).length} event{(row.events ?? []).length !== 1 ? 's' : ''}
        </Badge>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <Badge variant={statusBadgeVariant[row.status] ?? 'default'} size="sm" dot>
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
            (row.successRate ?? 0) >= 95
              ? 'text-success-600'
              : (row.successRate ?? 0) >= 70
                ? 'text-warning-600'
                : 'text-error-600'
          }`}
        >
          {row.successRate ?? 0}%
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
        <span
          className={(row.failCount ?? 0) > 50 ? 'text-error-600 font-medium' : 'text-neutral-500'}
        >
          {row.failCount ?? 0}
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
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  const res = await apiRequest(`/api/v1/developer/webhooks/${row.id}`, {
                    method: 'PATCH',
                    body: { status: 'paused' },
                  });
                  if (res.ok) {
                    refetchWebhooks();
                  } else {
                    const result = await res.json().catch(() => ({}));
                    alert(result.message || 'Failed to pause webhook.');
                  }
                } catch {
                  alert('Network error. Please try again.');
                }
              }}
            >
              Pause
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  const res = await apiRequest(`/api/v1/developer/webhooks/${row.id}`, {
                    method: 'PATCH',
                    body: { status: 'active' },
                  });
                  if (res.ok) {
                    refetchWebhooks();
                  } else {
                    const result = await res.json().catch(() => ({}));
                    alert(result.message || 'Failed to resume webhook.');
                  }
                } catch {
                  alert('Network error. Please try again.');
                }
              }}
            >
              Resume
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-error-600 hover:text-error-700"
            onClick={async () => {
              if (!confirm('Delete this webhook? This cannot be undone.')) return;
              try {
                const res = await apiRequest(`/api/v1/developer/webhooks/${row.id}`, {
                  method: 'DELETE',
                });
                if (res.ok) {
                  refetchWebhooks();
                } else {
                  const result = await res.json().catch(() => ({}));
                  alert(result.message || 'Failed to delete webhook.');
                }
              } catch {
                alert('Network error. Please try again.');
              }
            }}
          >
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

  // Loading skeleton
  if (loading) {
    return (
      <PageShell
        title="Developer Portal"
        description="Manage API keys, webhooks, and integration settings."
      >
        <Skeleton className="mb-6 h-12 rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <Skeleton className="mt-6 h-64 rounded-2xl" />
      </PageShell>
    );
  }

  // Error state
  if (error) {
    return (
      <PageShell
        title="Developer Portal"
        description="Manage API keys, webhooks, and integration settings."
      >
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load developer portal data"
          description={error}
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                refetchKeys();
                refetchWebhooks();
              }}
            >
              Try Again
            </Button>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Developer Portal"
      description="Manage API keys, webhooks, and integration settings."
      actions={
        <>
          {activeTab === 'api-keys' && (
            <Button size="sm" onClick={() => setShowCreateKeyDialog(true)}>
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
          {apiKeys.length === 0 ? (
            <EmptyState
              icon={<Key className="h-6 w-6" />}
              title="No API keys created yet"
              description="Generate your first API key to start integrating with the platform."
              action={
                <Button size="sm" onClick={() => setShowCreateKeyDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Generate API Key
                </Button>
              }
            />
          ) : (
            <DataTable<ApiKeyItem>
              columns={apiKeyColumns}
              data={apiKeys}
              emptyMessage="No API keys created yet."
              emptyIcon={<Key className="h-5 w-5" />}
            />
          )}
        </div>
      )}

      {/* Tab: Webhooks */}
      {activeTab === 'webhooks' && (
        <>
          {webhooks.length === 0 ? (
            <EmptyState
              icon={<Webhook className="h-6 w-6" />}
              title="No webhooks configured yet"
              description="Create a webhook to receive real-time notifications about events in your property."
              action={
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  Create Webhook
                </Button>
              }
            />
          ) : (
            <DataTable<WebhookItem>
              columns={webhookColumns}
              data={webhooks}
              emptyMessage="No webhooks configured yet."
              emptyIcon={<Webhook className="h-5 w-5" />}
            />
          )}
        </>
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

      {/* Create API Key Dialog */}
      <CreateApiKeyDialog
        open={showCreateKeyDialog}
        onOpenChange={setShowCreateKeyDialog}
        onSuccess={() => refetchKeys()}
      />
    </PageShell>
  );
}
