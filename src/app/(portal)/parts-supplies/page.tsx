'use client';

import { PageShell } from '@/components/layout/page-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';

export default function PartsSuppliesPage() {
  return (
    <PageShell
      title="Parts & Supplies"
      description="Track maintenance inventory and supply levels."
    >
      <Card>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
            <Package className="h-7 w-7 text-neutral-400" />
          </div>
          <Badge variant="default" size="md" className="mb-3">
            Coming Soon
          </Badge>
          <h3 className="text-[16px] font-semibold text-neutral-900">Parts & Supplies Inventory</h3>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed text-neutral-500">
            Track maintenance inventory, monitor stock levels, and manage supply orders to keep your
            building running smoothly.
          </p>
          <p className="mt-4 text-[13px] text-neutral-400">
            This feature is planned for a future release.
          </p>
        </div>
      </Card>
    </PageShell>
  );
}
