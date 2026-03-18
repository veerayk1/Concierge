'use client';

import {
  Activity,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  Wifi,
  XCircle,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency?: string;
  uptime: string;
  icon: typeof Server;
  lastChecked: string;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const SERVICES: ServiceStatus[] = [
  {
    name: 'API Server',
    status: 'healthy',
    latency: '23ms',
    uptime: '99.99%',
    icon: Server,
    lastChecked: '2026-03-18T12:00:00',
  },
  {
    name: 'Database (PostgreSQL)',
    status: 'healthy',
    latency: '5ms',
    uptime: '99.99%',
    icon: Database,
    lastChecked: '2026-03-18T12:00:00',
  },
  {
    name: 'Cache (Redis)',
    status: 'healthy',
    latency: '1ms',
    uptime: '99.98%',
    icon: HardDrive,
    lastChecked: '2026-03-18T12:00:00',
  },
  {
    name: 'Job Queue (BullMQ)',
    status: 'healthy',
    latency: '12ms',
    uptime: '99.97%',
    icon: Cpu,
    lastChecked: '2026-03-18T12:00:00',
  },
  {
    name: 'WebSocket Server',
    status: 'healthy',
    latency: '8ms',
    uptime: '99.95%',
    icon: Wifi,
    lastChecked: '2026-03-18T12:00:00',
  },
  {
    name: 'Email Service (Resend)',
    status: 'healthy',
    latency: '150ms',
    uptime: '99.90%',
    icon: Activity,
    lastChecked: '2026-03-18T12:00:00',
  },
  {
    name: 'File Storage (S3)',
    status: 'healthy',
    latency: '45ms',
    uptime: '99.99%',
    icon: HardDrive,
    lastChecked: '2026-03-18T12:00:00',
  },
];

const STATUS_CONFIG = {
  healthy: {
    label: 'Healthy',
    variant: 'success' as const,
    icon: CheckCircle2,
    color: 'text-success-600',
  },
  degraded: {
    label: 'Degraded',
    variant: 'warning' as const,
    icon: Clock,
    color: 'text-warning-600',
  },
  down: { label: 'Down', variant: 'error' as const, icon: XCircle, color: 'text-error-600' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SystemHealthPage() {
  const healthyCount = SERVICES.filter((s) => s.status === 'healthy').length;
  const allHealthy = healthyCount === SERVICES.length;

  return (
    <PageShell
      title="System Health"
      description="Monitor system status, service health, and performance metrics."
      actions={
        <Button variant="secondary" size="sm">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      }
    >
      {/* Overall Status */}
      <Card
        className={`mb-8 border-2 ${allHealthy ? 'border-success-200 bg-success-50/30' : 'border-warning-200 bg-warning-50/30'}`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${allHealthy ? 'bg-success-100' : 'bg-warning-100'}`}
          >
            {allHealthy ? (
              <CheckCircle2 className="text-success-600 h-7 w-7" />
            ) : (
              <Clock className="text-warning-600 h-7 w-7" />
            )}
          </div>
          <div>
            <h2 className="text-[20px] font-bold text-neutral-900">
              {allHealthy ? 'All Systems Operational' : 'Some Systems Degraded'}
            </h2>
            <p className="text-[14px] text-neutral-600">
              {healthyCount}/{SERVICES.length} services healthy &middot; Last checked{' '}
              {new Date().toLocaleString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </Card>

      {/* Service Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service) => {
          const config = STATUS_CONFIG[service.status];
          const StatusIcon = config.icon;
          const ServiceIcon = service.icon;

          return (
            <Card key={service.name}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100">
                    <ServiceIcon className="h-4 w-4 text-neutral-600" />
                  </div>
                  <div>
                    <h3 className="text-[14px] font-semibold text-neutral-900">{service.name}</h3>
                  </div>
                </div>
                <Badge variant={config.variant} size="sm" dot>
                  {config.label}
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-medium tracking-wide text-neutral-400 uppercase">
                    Latency
                  </p>
                  <p className="mt-0.5 text-[15px] font-semibold text-neutral-900">
                    {service.latency}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium tracking-wide text-neutral-400 uppercase">
                    Uptime
                  </p>
                  <p className="text-success-700 mt-0.5 text-[15px] font-semibold">
                    {service.uptime}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
