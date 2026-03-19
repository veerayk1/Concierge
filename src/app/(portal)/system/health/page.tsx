'use client';

import { useState } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Activity,
  Server,
  Database,
  Cpu,
  HardDrive,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Wifi,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatusCard {
  title: string;
  icon: typeof Activity;
  status: 'operational' | 'degraded' | 'down';
  metrics: { label: string; value: string }[];
}

interface SystemMetric {
  label: string;
  value: string;
  max?: string;
  percentage?: number;
  icon: typeof Activity;
  iconColor: string;
  iconBg: string;
}

interface Incident {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high';
  status: 'resolved' | 'investigating' | 'monitoring';
  timestamp: string;
  duration: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const STATUS_CARDS: StatusCard[] = [
  {
    title: 'API',
    icon: Server,
    status: 'operational',
    metrics: [
      { label: 'Response Time', value: '42ms' },
      { label: 'Uptime', value: '99.99%' },
      { label: 'Requests/min', value: '1,247' },
    ],
  },
  {
    title: 'Database',
    icon: Database,
    status: 'operational',
    metrics: [
      { label: 'Connections', value: '12 / 100' },
      { label: 'Query Time', value: '8ms' },
      { label: 'Replication Lag', value: '0ms' },
    ],
  },
  {
    title: 'Storage',
    icon: HardDrive,
    status: 'operational',
    metrics: [
      { label: 'Used', value: '45 GB / 100 GB' },
      { label: 'IOPS', value: '320' },
      { label: 'Utilization', value: '45%' },
    ],
  },
  {
    title: 'Queue',
    icon: Activity,
    status: 'operational',
    metrics: [
      { label: 'Pending Jobs', value: '3' },
      { label: 'Failed', value: '0' },
      { label: 'Throughput', value: '842/hr' },
    ],
  },
];

const SYSTEM_METRICS: SystemMetric[] = [
  {
    label: 'CPU Usage',
    value: '23%',
    percentage: 23,
    icon: Cpu,
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-50',
  },
  {
    label: 'Memory',
    value: '4.2 GB',
    max: '8 GB',
    percentage: 52,
    icon: Server,
    iconColor: 'text-info-600',
    iconBg: 'bg-info-50',
  },
  {
    label: 'Disk I/O',
    value: '120 MB/s',
    percentage: 38,
    icon: HardDrive,
    iconColor: 'text-warning-600',
    iconBg: 'bg-warning-50',
  },
  {
    label: 'Network',
    value: '85 Mbps',
    percentage: 17,
    icon: Wifi,
    iconColor: 'text-success-600',
    iconBg: 'bg-success-50',
  },
];

const RECENT_INCIDENTS: Incident[] = [
  {
    id: 'INC-001',
    title: 'Elevated API latency in US-East region',
    severity: 'medium',
    status: 'resolved',
    timestamp: '2026-03-18 14:32 UTC',
    duration: '12 min',
  },
  {
    id: 'INC-002',
    title: 'Database connection pool spike',
    severity: 'low',
    status: 'resolved',
    timestamp: '2026-03-17 09:15 UTC',
    duration: '5 min',
  },
  {
    id: 'INC-003',
    title: 'Scheduled storage migration completed',
    severity: 'low',
    status: 'resolved',
    timestamp: '2026-03-16 02:00 UTC',
    duration: '45 min',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const statusConfig = {
  operational: { label: 'Operational', variant: 'success' as const, Icon: CheckCircle2 },
  degraded: { label: 'Degraded', variant: 'warning' as const, Icon: AlertTriangle },
  down: { label: 'Down', variant: 'error' as const, Icon: XCircle },
};

const severityVariant = {
  low: 'default' as const,
  medium: 'warning' as const,
  high: 'error' as const,
};

const incidentStatusVariant = {
  resolved: 'success' as const,
  investigating: 'error' as const,
  monitoring: 'warning' as const,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PlatformHealthPage() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  };

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
          <Button variant="secondary" size="sm" loading={refreshing} onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      }
    >
      {/* Last updated */}
      <div className="flex items-center gap-2 text-[13px] text-neutral-400">
        <Clock className="h-3.5 w-3.5" />
        Last updated: {new Date().toLocaleTimeString()} UTC
      </div>

      {/* Status Overview */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATUS_CARDS.map((card) => {
          const Icon = card.icon;
          const config = statusConfig[card.status];
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
                    <span className="text-[13px] font-medium text-neutral-900">{metric.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* System Metrics */}
      <div className="mt-8">
        <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">System Metrics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SYSTEM_METRICS.map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.label} padding="md">
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${metric.iconBg}`}
                  >
                    <Icon className={`h-4 w-4 ${metric.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-[13px] text-neutral-500">{metric.label}</p>
                    <p className="text-[18px] font-bold text-neutral-900">
                      {metric.value}
                      {metric.max && (
                        <span className="text-[13px] font-normal text-neutral-400">
                          {' '}
                          / {metric.max}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {metric.percentage !== undefined && (
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        metric.percentage > 80
                          ? 'bg-error-500'
                          : metric.percentage > 60
                            ? 'bg-warning-500'
                            : 'bg-primary-500'
                      }`}
                      style={{ width: `${metric.percentage}%` }}
                    />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="mt-8">
        <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">Recent Incidents</h2>
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="px-6 py-3 text-left text-[12px] font-semibold tracking-wider text-neutral-400 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-[12px] font-semibold tracking-wider text-neutral-400 uppercase">
                    Incident
                  </th>
                  <th className="px-6 py-3 text-left text-[12px] font-semibold tracking-wider text-neutral-400 uppercase">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-[12px] font-semibold tracking-wider text-neutral-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-[12px] font-semibold tracking-wider text-neutral-400 uppercase">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-[12px] font-semibold tracking-wider text-neutral-400 uppercase">
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {RECENT_INCIDENTS.map((incident) => (
                  <tr key={incident.id} className="hover:bg-neutral-25 transition-colors">
                    <td className="px-6 py-4 text-[13px] font-medium whitespace-nowrap text-neutral-900">
                      {incident.id}
                    </td>
                    <td className="px-6 py-4 text-[13px] text-neutral-700">{incident.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={severityVariant[incident.severity]} size="sm">
                        {incident.severity}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={incidentStatusVariant[incident.status]} size="sm" dot>
                        {incident.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-[13px] whitespace-nowrap text-neutral-500">
                      {incident.timestamp}
                    </td>
                    <td className="px-6 py-4 text-[13px] whitespace-nowrap text-neutral-500">
                      {incident.duration}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
