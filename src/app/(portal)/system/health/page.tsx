'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Activity,
  Server,
  Database,
  HardDrive,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Wifi,
  Loader2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types matching /api/health/detailed response
// ---------------------------------------------------------------------------

interface ServiceCheck {
  status: 'ok' | 'degraded' | 'error';
  responseTime: string;
  error?: string;
}

interface DetailedHealthResponse {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  responseTime: string;
  services: {
    database: ServiceCheck;
    redis: ServiceCheck;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const statusConfig = {
  ok: { label: 'Operational', variant: 'success' as const, Icon: CheckCircle2 },
  operational: { label: 'Operational', variant: 'success' as const, Icon: CheckCircle2 },
  degraded: { label: 'Degraded', variant: 'warning' as const, Icon: AlertTriangle },
  unhealthy: { label: 'Down', variant: 'error' as const, Icon: XCircle },
  error: { label: 'Down', variant: 'error' as const, Icon: XCircle },
};

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PlatformHealthPage() {
  const [data, setData] = useState<DetailedHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/health/detailed');
      const result: DetailedHealthResponse = await response.json();
      setData(result);
      setLastFetched(new Date());
    } catch {
      setError('Failed to reach health endpoint.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Build status cards from real data
  const serviceCards = data
    ? [
        {
          title: 'API',
          icon: Server,
          status: data.status,
          metrics: [
            { label: 'Response Time', value: data.responseTime },
            { label: 'Uptime', value: formatUptime(data.uptime) },
            { label: 'Version', value: `v${data.version}` },
          ],
        },
        {
          title: 'Database',
          icon: Database,
          status: data.services.database.status,
          metrics: [
            { label: 'Response Time', value: data.services.database.responseTime },
            {
              label: 'Status',
              value: data.services.database.status === 'ok' ? 'Connected' : 'Error',
            },
            ...(data.services.database.error
              ? [{ label: 'Error', value: data.services.database.error.slice(0, 40) }]
              : [{ label: 'Health', value: 'Healthy' }]),
          ],
        },
        {
          title: 'Cache (Redis)',
          icon: HardDrive,
          status: data.services.redis.status,
          metrics: [
            { label: 'Response Time', value: data.services.redis.responseTime },
            {
              label: 'Status',
              value:
                data.services.redis.status === 'ok'
                  ? 'Connected'
                  : data.services.redis.status === 'degraded'
                    ? 'Not Configured'
                    : 'Error',
            },
            ...(data.services.redis.error
              ? [{ label: 'Note', value: data.services.redis.error.slice(0, 40) }]
              : [{ label: 'Health', value: 'Healthy' }]),
          ],
        },
        {
          title: 'Overall',
          icon: Activity,
          status: data.status,
          metrics: [
            {
              label: 'Platform Status',
              value:
                data.status === 'ok'
                  ? 'All Systems Go'
                  : data.status.charAt(0).toUpperCase() + data.status.slice(1),
            },
            { label: 'Checked At', value: new Date(data.timestamp).toLocaleTimeString() },
            { label: 'Total Response', value: data.responseTime },
          ],
        },
      ]
    : [];

  return (
    <PageShell
      title="Platform Health"
      description="Monitor system performance, uptime, and resource utilization."
      actions={
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm">
            <ExternalLink className="h-4 w-4" />
            Status Page
          </Button>
          <Button variant="secondary" size="sm" loading={loading} onClick={fetchHealth}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      }
    >
      {/* Last updated */}
      <div className="flex items-center gap-2 text-[13px] text-neutral-400">
        <Clock className="h-3.5 w-3.5" />
        {lastFetched
          ? `Last updated: ${lastFetched.toLocaleTimeString()}`
          : 'Fetching health data...'}
      </div>

      {/* Loading State */}
      {loading && !data && (
        <div className="mt-12 flex flex-col items-center justify-center py-24">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="mt-3 text-[14px] text-neutral-500">Checking system health...</p>
        </div>
      )}

      {/* Error State */}
      {error && !data && (
        <div className="mt-6">
          <Card padding="md" className="border-error-200 bg-error-50/30">
            <div className="flex items-center gap-3">
              <XCircle className="text-error-500 h-5 w-5" />
              <div>
                <p className="text-[14px] font-semibold text-neutral-900">Health check failed</p>
                <p className="text-[13px] text-neutral-600">{error}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Status Overview */}
      {data && (
        <>
          {/* Overall Status Banner */}
          <div className="mt-4">
            {(() => {
              const config = statusConfig[data.status] || statusConfig.ok;
              const StatusIcon = config.Icon;
              return (
                <div
                  className={`flex items-center gap-3 rounded-xl border px-5 py-3 ${
                    data.status === 'ok'
                      ? 'border-success-200 bg-success-50/40'
                      : data.status === 'degraded'
                        ? 'border-warning-200 bg-warning-50/40'
                        : 'border-error-200 bg-error-50/40'
                  }`}
                >
                  <StatusIcon
                    className={`h-5 w-5 ${
                      data.status === 'ok'
                        ? 'text-success-600'
                        : data.status === 'degraded'
                          ? 'text-warning-600'
                          : 'text-error-600'
                    }`}
                  />
                  <span className="text-[14px] font-medium text-neutral-900">
                    {data.status === 'ok'
                      ? 'All systems operational'
                      : data.status === 'degraded'
                        ? 'Some services are degraded'
                        : 'System is experiencing issues'}
                  </span>
                  <Badge variant={config.variant} size="sm" className="ml-auto">
                    {config.label}
                  </Badge>
                </div>
              );
            })()}
          </div>

          {/* Service Cards */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {serviceCards.map((card) => {
              const Icon = card.icon;
              const config =
                statusConfig[card.status as keyof typeof statusConfig] || statusConfig.ok;
              const StatusIcon = config.Icon;
              return (
                <Card key={card.title} padding="md">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-50">
                        <Icon className="h-5 w-5 text-neutral-700" />
                      </div>
                      <h3 className="text-[15px] font-semibold text-neutral-900">{card.title}</h3>
                    </div>
                    <Badge variant={config.variant} size="sm" dot>
                      {config.label}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {card.metrics.map((metric) => (
                      <div key={metric.label} className="flex items-center justify-between">
                        <span className="text-[13px] text-neutral-500">{metric.label}</span>
                        <span className="text-[13px] font-medium text-neutral-900">
                          {metric.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* System Info */}
          <div className="mt-8">
            <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">System Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-50 flex h-9 w-9 items-center justify-center rounded-xl">
                    <Server className="text-primary-600 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[13px] text-neutral-500">Version</p>
                    <p className="text-[18px] font-bold text-neutral-900">v{data.version}</p>
                  </div>
                </div>
              </Card>
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="bg-info-50 flex h-9 w-9 items-center justify-center rounded-xl">
                    <Clock className="text-info-600 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[13px] text-neutral-500">Uptime</p>
                    <p className="text-[18px] font-bold text-neutral-900">
                      {formatUptime(data.uptime)}
                    </p>
                  </div>
                </div>
              </Card>
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="bg-success-50 flex h-9 w-9 items-center justify-center rounded-xl">
                    <Wifi className="text-success-600 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[13px] text-neutral-500">API Response</p>
                    <p className="text-[18px] font-bold text-neutral-900">{data.responseTime}</p>
                  </div>
                </div>
              </Card>
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="bg-warning-50 flex h-9 w-9 items-center justify-center rounded-xl">
                    <Database className="text-warning-600 h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[13px] text-neutral-500">DB Response</p>
                    <p className="text-[18px] font-bold text-neutral-900">
                      {data.services.database.responseTime}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}
