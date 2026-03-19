'use client';

import { PageShell } from '@/components/layout/page-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Plus, Search, AlertTriangle } from 'lucide-react';

const INVENTORY = [
  { name: 'Light Bulbs (LED, 60W)', sku: 'LB-60W', qty: 45, minQty: 10, category: 'Electrical' },
  { name: 'Air Filters (20x25x1)', sku: 'AF-2025', qty: 8, minQty: 12, category: 'HVAC' },
  { name: 'Faucet Washers (Assorted)', sku: 'FW-AST', qty: 120, minQty: 20, category: 'Plumbing' },
  {
    name: 'Paint - Hallway White (1 gal)',
    sku: 'PT-HW1G',
    qty: 3,
    minQty: 5,
    category: 'Painting',
  },
  { name: 'Door Hinges (3.5")', sku: 'DH-35', qty: 24, minQty: 10, category: 'Hardware' },
  { name: 'Smoke Detector Batteries (9V)', sku: 'SD-9V', qty: 60, minQty: 20, category: 'Safety' },
  { name: 'Carpet Tiles (Lobby)', sku: 'CT-LBY', qty: 15, minQty: 10, category: 'Flooring' },
  { name: 'Toilet Flush Valve', sku: 'TFV-01', qty: 6, minQty: 4, category: 'Plumbing' },
];

export default function PartsSuppliesPage() {
  const lowStock = INVENTORY.filter((i) => i.qty < i.minQty);

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
          <p className="text-[24px] font-bold text-neutral-900">{INVENTORY.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[12px] font-medium text-neutral-500 uppercase">Low Stock</p>
          <p className="text-warning-600 text-[24px] font-bold">{lowStock.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[12px] font-medium text-neutral-500 uppercase">Categories</p>
          <p className="text-[24px] font-bold text-neutral-900">
            {new Set(INVENTORY.map((i) => i.category)).size}
          </p>
        </Card>
      </div>

      <div className="mb-4">
        <Input placeholder="Search parts and supplies..." className="max-w-sm" />
      </div>

      <Card padding="none">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50/80">
              <th className="px-5 py-3 text-left text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
                Item
              </th>
              <th className="px-5 py-3 text-left text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
                SKU
              </th>
              <th className="px-5 py-3 text-left text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
                Category
              </th>
              <th className="px-5 py-3 text-left text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
                Qty
              </th>
              <th className="px-5 py-3 text-left text-[12px] font-semibold tracking-wide text-neutral-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {INVENTORY.map((item) => (
              <tr key={item.sku} className="transition-colors hover:bg-neutral-50">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-neutral-400" />
                    <span className="text-[14px] font-medium text-neutral-900">{item.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 font-mono text-[14px] text-neutral-500">{item.sku}</td>
                <td className="px-5 py-3.5">
                  <Badge variant="default" size="sm">
                    {item.category}
                  </Badge>
                </td>
                <td className="px-5 py-3.5 text-[14px] font-medium text-neutral-900">{item.qty}</td>
                <td className="px-5 py-3.5">
                  {item.qty < item.minQty ? (
                    <Badge variant="warning" size="sm" dot>
                      <AlertTriangle className="mr-1 h-3 w-3" /> Low Stock
                    </Badge>
                  ) : (
                    <Badge variant="success" size="sm" dot>
                      In Stock
                    </Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </PageShell>
  );
}
