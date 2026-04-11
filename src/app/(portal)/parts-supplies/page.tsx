'use client';

import { PageShell } from '@/components/layout/page-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Plus } from 'lucide-react';

export default function PartsSuppliesPage() {
  return (
    <PageShell
      title="Parts & Supplies"
      description="Track maintenance inventory and supply levels."
      actions={
        <Button size="sm">
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      }
    >
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card padding="sm">
          <p className="text-[12px] font-medium text-neutral-500 uppercase">Total Items</p>
          <p className="text-[24px] font-bold text-neutral-900">0</p>
        </Card>
        <Card padding="sm">
          <p className="text-[12px] font-medium text-neutral-500 uppercase">Low Stock</p>
          <p className="text-warning-600 text-[24px] font-bold">0</p>
        </Card>
        <Card padding="sm">
          <p className="text-[12px] font-medium text-neutral-500 uppercase">Categories</p>
          <p className="text-[24px] font-bold text-neutral-900">0</p>
        </Card>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-200 py-16">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100">
          <Package className="h-5 w-5 text-neutral-400" />
        </div>
        <p className="mt-4 text-[15px] font-medium text-neutral-600">
          No parts &amp; supplies tracked
        </p>
        <p className="mt-1 text-[13px] text-neutral-400">Add inventory items to get started.</p>
        <Button size="sm" className="mt-5">
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>
    </PageShell>
  );
}
