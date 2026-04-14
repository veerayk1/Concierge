'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  Cloud,
  ExternalLink,
  Info,
  Loader2,
  MessageCircle,
  ShieldAlert,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface IntegrationDef {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  docsUrl?: string;
}

interface IntegrationStatus {
  [integrationId: string]: {
    connected: boolean;
    lastSync?: string;
    details?: string;
    configuredAt?: string;
  };
}

interface SettingsApiData {
  property: {
    id: string;
    name: string;
    branding: unknown;
  };
  eventTypes: unknown[];
}

// ---------------------------------------------------------------------------
// Static integration definitions
// ---------------------------------------------------------------------------

const INTEGRATION_DEFS: IntegrationDef[] = [
  {
    id: 'slack',
    name: 'Slack',
    description:
      'Send real-time notifications to Slack channels for events, incidents, and maintenance updates.',
    icon: MessageCircle,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    id: 'sentry',
    name: 'Sentry',
    description: 'Error tracking and performance monitoring for the Concierge platform.',
    icon: ShieldAlert,
    color: 'text-error-600',
    bgColor: 'bg-error-50',
  },
  {
    id: 'aws-s3',
    name: 'AWS S3 / Storage',
    description: 'Cloud storage for document uploads, photos, attachments, and backups.',
    icon: Cloud,
    color: 'text-warning-600',
    bgColor: 'bg-warning-50',
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar Sync',
    description: 'Sync amenity bookings and community events with Google Calendar.',
    icon: Calendar,
    color: 'text-info-600',
    bgColor: 'bg-info-50',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function IntegrationsPage() {
  const propertyId = getPropertyId();
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    type: 'info' | 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    data: settingsData,
    loading,
    error,
    refetch,
  } = useApi<SettingsApiData>(apiUrl('/api/v1/settings', { propertyId }));

  // Extract integration status from branding JSON
  const integrationStatus = useMemo<IntegrationStatus>(() => {
    if (!settingsData?.property?.branding) return {};
    const branding = settingsData.property.branding as Record<string, unknown>;
    return (branding?.integrations as IntegrationStatus) || {};
  }, [settingsData]);

  const connectedIntegrations = INTEGRATION_DEFS.filter((i) => integrationStatus[i.id]?.connected);
  const availableIntegrations = INTEGRATION_DEFS.filter((i) => !integrationStatus[i.id]?.connected);

  function showToast(type: 'info' | 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleConnect(integrationId: string) {
    setConnectingId(integrationId);
    setToast(null);

    // Persist the connection status to branding JSON
    const existingBranding =
      settingsData?.property?.branding && typeof settingsData.property.branding === 'object'
        ? (settingsData.property.branding as Record<string, unknown>)
        : {};
    const existingIntegrations = (existingBranding.integrations as IntegrationStatus) || {};

    const body = {
      propertyId,
      branding: {
        ...existingBranding,
        integrations: {
          ...existingIntegrations,
          [integrationId]: {
            connected: true,
            configuredAt: new Date().toISOString(),
            details: 'Pending configuration',
          },
        },
      },
    };

    try {
      const res = await apiRequest('/api/v1/settings', { method: 'PATCH', body });
      if (!res.ok) {
        const result = await res.json();
        showToast('error', result.message || 'Failed to connect integration');
        return;
      }
      showToast(
        'success',
        `${INTEGRATION_DEFS.find((i) => i.id === integrationId)?.name} connected. Configure it in the details panel.`,
      );
      refetch();
    } catch {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setConnectingId(null);
    }
  }

  async function handleDisconnect(integrationId: string) {
    setDisconnectingId(integrationId);
    setToast(null);

    const existingBranding =
      settingsData?.property?.branding && typeof settingsData.property.branding === 'object'
        ? (settingsData.property.branding as Record<string, unknown>)
        : {};
    const existingIntegrations = (existingBranding.integrations as IntegrationStatus) || {};

    const updated = { ...existingIntegrations };
    delete updated[integrationId];

    const body = {
      propertyId,
      branding: {
        ...existingBranding,
        integrations: updated,
      },
    };

    try {
      const res = await apiRequest('/api/v1/settings', { method: 'PATCH', body });
      if (!res.ok) {
        const result = await res.json();
        showToast('error', result.message || 'Failed to disconnect integration');
        return;
      }
      showToast(
        'info',
        `${INTEGRATION_DEFS.find((i) => i.id === integrationId)?.name} disconnected.`,
      );
      refetch();
    } catch {
      showToast('error', 'Network error. Please try again.');
    } finally {
      setDisconnectingId(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 py-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-24" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------

  if (error) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Failed to load integrations"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      {/* Back Navigation */}
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">Integrations</h1>
        <p className="mt-1 text-[14px] text-neutral-500">
          Manage third-party integrations and API connections.
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-[13px] ${
            toast.type === 'success'
              ? 'border-success-200 bg-success-50/40 text-success-700'
              : toast.type === 'error'
                ? 'border-error-200 bg-error-50/40 text-error-700'
                : 'border-info-200 bg-info-50/40 text-info-700'
          }`}
        >
          {toast.type === 'success' ? (
            <Check className="h-4 w-4 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <Info className="h-4 w-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Connected */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Connected ({connectedIntegrations.length})
        </h2>
        {connectedIntegrations.length === 0 ? (
          <Card padding="md">
            <p className="text-center text-[13px] text-neutral-400">
              No integrations connected yet.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {connectedIntegrations.map((integration) => {
              const Icon = integration.icon;
              const status = integrationStatus[integration.id];
              return (
                <Card key={integration.id}>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${integration.bgColor}`}
                      >
                        <Icon className={`h-5 w-5 ${integration.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[15px] font-semibold text-neutral-900">
                            {integration.name}
                          </h3>
                          <Badge variant="success" size="sm" dot>
                            Connected
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-[13px] text-neutral-500">
                          {integration.description}
                        </p>
                        {status?.details && (
                          <p className="mt-1.5 text-[12px] text-neutral-400">{status.details}</p>
                        )}
                        {status?.configuredAt && (
                          <p className="mt-1 text-[12px] text-neutral-400">
                            Connected: {new Date(status.configuredAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDisconnect(integration.id)}
                          loading={disconnectingId === integration.id}
                        >
                          <X className="h-4 w-4" />
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Available */}
      {availableIntegrations.length > 0 && (
        <div>
          <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
            Available ({availableIntegrations.length})
          </h2>
          <div className="space-y-3">
            {availableIntegrations.map((integration) => {
              const Icon = integration.icon;
              return (
                <Card key={integration.id}>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${integration.bgColor}`}
                      >
                        <Icon className={`h-5 w-5 ${integration.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[15px] font-semibold text-neutral-900">
                            {integration.name}
                          </h3>
                          <Badge variant="default" size="sm">
                            Not Connected
                          </Badge>
                        </div>
                        <p className="mt-0.5 text-[13px] text-neutral-500">
                          {integration.description}
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleConnect(integration.id)}
                        loading={connectingId === integration.id}
                      >
                        Connect
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
