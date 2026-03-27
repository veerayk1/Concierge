'use client';

/**
 * Batch Package Intake Dialog — per PRD 04 Section 3.1.3
 * Multi-row form for logging multiple packages at once
 */

import { useState, useEffect } from 'react';
import { Package, Plus, Trash2 } from 'lucide-react';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePropertyUnits } from '@/lib/hooks/use-property-units';

interface PackageRow {
  id: string;
  unitId: string;
  courier: string;
  trackingNumber: string;
  description: string;
  isPerishable: boolean;
}

const EMPTY_ROW = (): PackageRow => ({
  id: crypto.randomUUID(),
  unitId: '',
  courier: '',
  trackingNumber: '',
  description: '',
  isPerishable: false,
});

interface CourierOption {
  id: string;
  name: string;
}

function useCouriers(propertyId: string) {
  const [couriers, setCouriers] = useState<CourierOption[]>([]);
  useEffect(() => {
    if (!propertyId) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const demoRole = typeof window !== 'undefined' ? localStorage.getItem('demo_role') : null;
    if (demoRole) headers['x-demo-role'] = demoRole;
    fetch(`/api/v1/couriers?propertyId=${propertyId}`, { headers })
      .then((r) => r.json())
      .then((d) => {
        if (d.data && Array.isArray(d.data)) {
          setCouriers(d.data.map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
        }
      })
      .catch(() => {});
  }, [propertyId]);
  return couriers;
}

interface BatchPackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function BatchPackageDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: BatchPackageDialogProps) {
  const { units, loading: unitsLoading } = usePropertyUnits(propertyId);
  const couriers = useCouriers(propertyId);
  const [rows, setRows] = useState<PackageRow[]>([EMPTY_ROW(), EMPTY_ROW(), EMPTY_ROW()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  function addRow() {
    if (rows.length >= 20) return;
    setRows([...rows, EMPTY_ROW()]);
  }

  function removeRow(id: string) {
    if (rows.length <= 1) return;
    setRows(rows.filter((r) => r.id !== id));
  }

  function updateRow(id: string, field: keyof PackageRow, value: string | boolean) {
    setRows(rows.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function handleSubmit() {
    setServerError(null);
    const validRows = rows.filter((r) => r.unitId);

    if (validRows.length === 0) {
      setServerError('At least one row with a unit is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/v1/packages/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('demo_role')
            ? { 'x-demo-role': localStorage.getItem('demo_role')! }
            : {}),
          ...(typeof window !== 'undefined' && localStorage.getItem('auth_token')
            ? { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            : {}),
        },
        body: JSON.stringify({
          propertyId,
          packages: validRows.map((r) => ({
            unitId: r.unitId,
            direction: 'incoming',
            courierId: r.courier || undefined,
            trackingNumber: r.trackingNumber || undefined,
            description: r.description || undefined,
            isPerishable: r.isPerishable,
            isOversized: false,
            notifyChannel: 'default',
          })),
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setServerError('Your session has expired. Please log in again.');
          if (typeof window !== 'undefined') {
            setTimeout(() => { window.location.href = '/login'; }, 1500);
          }
          return;
        }
        const result = await response.json().catch(() => ({}));
        setServerError(result.message || `Batch intake failed (${response.status})`);
        return;
      }

      const result = await response.json();
      setRows([EMPTY_ROW(), EMPTY_ROW(), EMPTY_ROW()]);
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setServerError('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Package className="text-primary-500 h-5 w-5" />
          Batch Package Intake
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Log multiple packages at once. {rows.length}/20 rows.
        </DialogDescription>

        <div className="mt-6 flex flex-col gap-3">
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          {/* Header */}
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_80px_40px] gap-2 text-[11px] font-semibold tracking-[0.06em] text-neutral-400 uppercase">
            <span>Unit *</span>
            <span>Courier</span>
            <span>Tracking #</span>
            <span>Description</span>
            <span>Perish.</span>
            <span />
          </div>

          {/* Rows */}
          {rows.map((row) => (
            <div key={row.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_80px_40px] gap-2">
              <select
                value={row.unitId}
                onChange={(e) => updateRow(row.id, 'unitId', e.target.value)}
                disabled={unitsLoading}
                className="focus:border-primary-500 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none disabled:opacity-50"
              >
                <option value="">{unitsLoading ? 'Loading...' : 'Unit...'}</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.number}
                  </option>
                ))}
              </select>
              <select
                value={row.courier}
                onChange={(e) => updateRow(row.id, 'courier', e.target.value)}
                className="focus:border-primary-500 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 focus:ring-2 focus:outline-none"
              >
                <option value="">Courier...</option>
                {couriers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <input
                value={row.trackingNumber}
                onChange={(e) => updateRow(row.id, 'trackingNumber', e.target.value)}
                placeholder="Tracking #"
                className="focus:border-primary-500 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:outline-none"
              />
              <input
                value={row.description}
                onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                placeholder="Description"
                className="focus:border-primary-500 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:outline-none"
              />
              <label className="flex h-9 items-center justify-center">
                <input
                  type="checkbox"
                  checked={row.isPerishable}
                  onChange={(e) => updateRow(row.id, 'isPerishable', e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300"
                />
              </label>
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="hover:text-error-500 flex h-9 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100"
                disabled={rows.length <= 1}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Add Row */}
          {rows.length < 20 && (
            <button
              type="button"
              onClick={addRow}
              className="hover:border-primary-300 hover:text-primary-600 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 py-2 text-[13px] font-medium text-neutral-500 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Row
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-5">
          <p className="text-[13px] text-neutral-500">
            {rows.filter((r) => r.unitId).length} packages ready
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button loading={isSubmitting} disabled={isSubmitting} onClick={handleSubmit}>
              {isSubmitting ? 'Logging...' : `Log ${rows.filter((r) => r.unitId).length} Packages`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
