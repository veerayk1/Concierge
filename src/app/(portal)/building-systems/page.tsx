'use client';

import { PageShell } from '@/components/layout/page-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus } from 'lucide-react';

export default function BuildingSystemsPage() {
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
      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
            <Building2 className="h-7 w-7 text-neutral-400" />
          </div>
          <h3 className="text-[16px] font-semibold text-neutral-900">
            No building systems configured
          </h3>
          <p className="mt-1 max-w-sm text-[14px] text-neutral-500">
            Add systems in Settings to monitor their status, schedule maintenance, and track
            operational health.
          </p>
          <Button size="sm" className="mt-5">
            <Plus className="mr-1.5 h-4 w-4" />
            Add Your First System
          </Button>
        </div>
      </Card>
    </PageShell>
  );
}
