'use client';

import { PageShell } from '@/components/layout/page-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2 } from 'lucide-react';

export default function BuildingSystemsPage() {
  return (
    <PageShell title="Building Systems" description="Monitor and manage building infrastructure.">
      <Card>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
            <Building2 className="h-7 w-7 text-neutral-400" />
          </div>
          <Badge variant="default" size="md" className="mb-3">
            Coming Soon
          </Badge>
          <h3 className="text-[16px] font-semibold text-neutral-900">Building Infrastructure</h3>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed text-neutral-500">
            Monitor building systems, track operational health, and schedule infrastructure
            maintenance from a single dashboard.
          </p>
          <p className="mt-4 text-[13px] text-neutral-400">
            This feature is planned for a future release.
          </p>
        </div>
      </Card>
    </PageShell>
  );
}
