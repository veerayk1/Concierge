'use client';

import { Server, Settings } from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SystemHealthPage() {
  return (
    <PageShell
      title="System Health"
      description="Monitor system status, service health, and performance metrics."
    >
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
          <Server className="h-6 w-6 text-neutral-400" />
        </div>
        <h2 className="mt-4 text-[16px] font-semibold text-neutral-700">
          System health monitoring not configured
        </h2>
        <p className="mt-1 max-w-sm text-center text-[13px] text-neutral-400">
          Connect your services in Settings to monitor uptime, latency, and health status.
        </p>
        <Button variant="secondary" size="sm" className="mt-5">
          <Settings className="h-4 w-4" />
          Go to Settings
        </Button>
      </div>
    </PageShell>
  );
}
