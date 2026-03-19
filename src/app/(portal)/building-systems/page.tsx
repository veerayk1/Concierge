'use client';

import { PageShell } from '@/components/layout/page-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Droplets, Zap, Wind, Flame, Shield, Camera, Wifi, Plus, Thermometer } from 'lucide-react';

const SYSTEMS = [
  { name: 'HVAC', icon: Wind, status: 'operational' as const, lastChecked: '2 hours ago' },
  { name: 'Elevator A', icon: Zap, status: 'operational' as const, lastChecked: '1 hour ago' },
  { name: 'Elevator B', icon: Zap, status: 'maintenance' as const, lastChecked: '30 min ago' },
  { name: 'Fire Alarm', icon: Flame, status: 'operational' as const, lastChecked: '4 hours ago' },
  { name: 'Plumbing', icon: Droplets, status: 'operational' as const, lastChecked: '6 hours ago' },
  {
    name: 'Security Cameras',
    icon: Camera,
    status: 'operational' as const,
    lastChecked: '15 min ago',
  },
  {
    name: 'Access Control',
    icon: Shield,
    status: 'operational' as const,
    lastChecked: '10 min ago',
  },
  { name: 'Internet/WiFi', icon: Wifi, status: 'degraded' as const, lastChecked: '5 min ago' },
  { name: 'Heating', icon: Thermometer, status: 'operational' as const, lastChecked: '1 hour ago' },
];

const STATUS_BADGE = {
  operational: { variant: 'success' as const, label: 'Operational' },
  maintenance: { variant: 'warning' as const, label: 'Maintenance' },
  degraded: { variant: 'warning' as const, label: 'Degraded' },
};

export default function BuildingSystemsPage() {
  const operational = SYSTEMS.filter((s) => s.status === 'operational').length;

  return (
    <PageShell
      title="Building Systems"
      description="Monitor and manage building infrastructure."
      actions={
        <Button size="sm">
          <Plus className="h-4 w-4" /> Add System
        </Button>
      }
    >
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card padding="sm">
          <p className="text-[12px] font-medium text-neutral-500 uppercase">Total</p>
          <p className="text-[24px] font-bold text-neutral-900">{SYSTEMS.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[12px] font-medium text-neutral-500 uppercase">Operational</p>
          <p className="text-success-600 text-[24px] font-bold">{operational}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[12px] font-medium text-neutral-500 uppercase">Issues</p>
          <p className="text-warning-600 text-[24px] font-bold">{SYSTEMS.length - operational}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SYSTEMS.map((system) => {
          const badge = STATUS_BADGE[system.status];
          const Icon = system.icon;
          return (
            <Card key={system.name} hoverable>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
                    <Icon className="text-primary-600 h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-neutral-900">{system.name}</p>
                    <p className="text-[12px] text-neutral-500">Checked {system.lastChecked}</p>
                  </div>
                </div>
                <Badge variant={badge.variant} size="sm" dot>
                  {badge.label}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
