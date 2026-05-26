'use client';

/**
 * BulkPackageFastLane
 *
 * Holiday-season front desk: a courier just dropped 30 boxes on the
 * counter. The existing BatchPackageDialog asks them to pick a courier
 * AND a unit number from a dropdown FOR EACH ROW. At 30 boxes that's
 * 60 dropdown opens before they even hit submit, while the courier
 * stands there waiting for a signature.
 *
 * Fast Lane is the dedicated workflow for that scene:
 *
 *   1. PICK COURIER ONCE — applies to every row. (Most counter dumps
 *      are single-courier — Amazon, UPS, etc.)
 *
 *   2. PASTE OR SCAN A COLUMN OF TRACKING NUMBERS — one per line.
 *      Hitting paste from a barcode-scanner app or a courier's manifest
 *      explodes into N rows pre-populated.
 *
 *   3. EACH ROW NEEDS ONE FIELD — the unit number. Filtered live as
 *      you type so they don't open a 200-row dropdown.
 *
 *   4. SUBMIT — and the dialog stays open with the courier preset
 *      remembered so the same person can run a SECOND dump from a
 *      different courier without starting over.
 *
 * Empty rows are dropped on submit so a partially-filled paste still
 * works. Validation is "at least one unit and either a tracking number
 * or a description" — defensive against the "I'll log it later" empty
 * row that the old form would silently accept.
 */

import { useEffect, useRef, useState } from 'react';
import { Boxes, Check, ClipboardPaste, Plus, Trash2, Zap } from 'lucide-react';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { usePropertyUnits } from '@/lib/hooks/use-property-units';

interface Row {
  rowId: string;
  unitInput: string;
  unitId: string | null;
  trackingNumber: string;
  description: string;
}

interface Courier {
  id: string;
  name: string;
  slug?: string;
}

const newRow = (overrides: Partial<Row> = {}): Row => ({
  rowId: crypto.randomUUID(),
  unitInput: '',
  unitId: null,
  trackingNumber: '',
  description: '',
  ...overrides,
});

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const tok = localStorage.getItem('auth_token');
    if (tok) h['Authorization'] = `Bearer ${tok}`;
    const demoRole = localStorage.getItem('demo_role');
    if (demoRole) h['x-demo-role'] = demoRole;
  }
  return h;
}

interface BulkPackageFastLaneProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function BulkPackageFastLane({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: BulkPackageFastLaneProps) {
  const { units, loading: unitsLoading } = usePropertyUnits(propertyId);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [courierId, setCourierId] = useState<string>('');
  const [rows, setRows] = useState<Row[]>([newRow(), newRow(), newRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastBatch, setLastBatch] = useState<number | null>(null);
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  // ------------------------------------------------------------------
  // Couriers — load once when the dialog opens.
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!open || !propertyId) return;
    fetch(`/api/v1/couriers?propertyId=${propertyId}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((j) => {
        const list: Courier[] = Array.isArray(j.data) ? j.data : [];
        setCouriers(list);
      })
      .catch(() => {});
  }, [open, propertyId]);

  // Re-resolve unitId for any pre-existing rows after units finish
  // loading. Depending on `units.length` avoids an infinite re-render
  // loop — usePropertyUnits returns a new array reference each render,
  // so depending on `units` itself would re-fire forever.
  useEffect(() => {
    if (units.length === 0) return;
    setRows((prev) => {
      let touched = false;
      const next = prev.map((r) => {
        if (!r.unitInput) {
          if (r.unitId) {
            touched = true;
            return { ...r, unitId: null };
          }
          return r;
        }
        const match = units.find(
          (u) => u.number.toLowerCase() === r.unitInput.trim().toLowerCase(),
        );
        const nextUnitId = match?.id ?? null;
        if (r.unitId === nextUnitId) return r;
        touched = true;
        return { ...r, unitId: nextUnitId };
      });
      return touched ? next : prev;
    });
  }, [units.length]);

  function update(rowId: string, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowId !== rowId) return r;
        const next = { ...r, ...patch };
        if (patch.unitInput !== undefined) {
          const match = units.find(
            (u) => u.number.toLowerCase() === (patch.unitInput || '').trim().toLowerCase(),
          );
          next.unitId = match?.id ?? null;
        }
        return next;
      }),
    );
  }

  function addRow() {
    if (rows.length >= 50) return;
    setRows((prev) => [...prev, newRow()]);
  }

  function removeRow(rowId: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.rowId !== rowId)));
  }

  // Paste-handler — one tracking number per line, OR `unit,tracking` pairs.
  function explodePaste(raw: string) {
    const lines = raw
      .split(/[\r\n]+/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    const parsed: Row[] = lines.map((l) => {
      // accept "1204, 1Z999AA10123456789"  OR just the tracking number
      const parts = l
        .split(/[,\t]/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length >= 2) {
        const match = units.find((u) => u.number.toLowerCase() === parts[0]!.toLowerCase());
        return newRow({
          unitInput: parts[0]!,
          unitId: match?.id ?? null,
          trackingNumber: parts.slice(1).join(' '),
        });
      }
      return newRow({ trackingNumber: parts[0]! });
    });

    setRows((prev) => {
      // Replace empty rows from the top first, append the rest
      const empty = prev.findIndex((r) => !r.unitInput && !r.trackingNumber && !r.description);
      if (empty === -1) return [...prev, ...parsed].slice(0, 50);
      const merged = [...prev];
      let inserted = 0;
      for (let i = empty; i < merged.length && inserted < parsed.length; i++) {
        if (!merged[i]!.unitInput && !merged[i]!.trackingNumber && !merged[i]!.description) {
          merged[i] = parsed[inserted++]!;
        }
      }
      if (inserted < parsed.length) merged.push(...parsed.slice(inserted));
      return merged.slice(0, 50);
    });
    if (pasteRef.current) pasteRef.current.value = '';
  }

  // ------------------------------------------------------------------
  // Submit — only rows that have a resolved unit AND something to
  // identify the package (tracking or description).
  // ------------------------------------------------------------------
  async function handleSubmit() {
    setError(null);
    const valid = rows.filter((r) => r.unitId && (r.trackingNumber.trim() || r.description.trim()));
    if (valid.length === 0) {
      setError('At least one row needs a matched unit and a tracking number or description.');
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch('/api/v1/packages/batch', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          propertyId,
          packages: valid.map((row) => ({
            unitId: row.unitId,
            direction: 'incoming',
            courierId: courierId || undefined,
            trackingNumber: row.trackingNumber.trim() || undefined,
            description: row.description.trim() || undefined,
            isPerishable: false,
            isOversized: false,
            notifyChannel: 'default',
          })),
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.message || `Batch intake failed (${r.status})`);
      }
      setLastBatch(valid.length);
      setRows([newRow(), newRow(), newRow()]);
      onSuccess?.();
      // Stay open — courier is remembered for the next run.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed.');
    } finally {
      setSubmitting(false);
    }
  }

  // ------------------------------------------------------------------
  // UI helpers
  // ------------------------------------------------------------------
  const readyCount = rows.filter(
    (r) => r.unitId && (r.trackingNumber.trim() || r.description.trim()),
  ).length;
  const unmatchedCount = rows.filter((r) => r.unitInput && !r.unitId).length;
  const courierLabel = couriers.find((c) => c.id === courierId)?.name ?? 'Pick courier';

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setError(null);
          setLastBatch(null);
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Zap className="h-5 w-5 text-amber-500" strokeWidth={2} />
          Fast lane intake
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Pick the courier once, paste or scan tracking numbers, match units. The dialog stays open
          for the next courier.
        </DialogDescription>

        {/* COURIER PRESET ----------------------------------------------------- */}
        <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 px-4 py-3">
          <label className="flex items-center gap-1.5 text-[11.5px] font-semibold tracking-[0.06em] text-amber-700 uppercase">
            <Boxes className="h-3.5 w-3.5" />
            Courier — applies to every row
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCourierId('')}
              className={`rounded-xl px-3 py-1.5 text-[12.5px] font-medium ring-1 transition ${
                courierId === ''
                  ? 'bg-neutral-900 text-white ring-neutral-900'
                  : 'bg-white text-neutral-700 ring-neutral-200 hover:ring-neutral-300'
              }`}
            >
              No courier
            </button>
            {couriers.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCourierId(c.id)}
                className={`rounded-xl px-3 py-1.5 text-[12.5px] font-medium ring-1 transition ${
                  courierId === c.id
                    ? 'bg-amber-500 text-white shadow-sm ring-amber-500'
                    : 'bg-white text-neutral-700 ring-neutral-200 hover:ring-amber-300'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* PASTE / SCAN BOX --------------------------------------------------- */}
        <div className="mt-4 flex flex-col gap-2">
          <label className="flex items-center gap-1.5 text-[11.5px] font-semibold tracking-[0.06em] text-neutral-500 uppercase">
            <ClipboardPaste className="h-3.5 w-3.5" />
            Paste tracking numbers — one per line. Or "unit, tracking" pairs.
          </label>
          <textarea
            ref={pasteRef}
            onPaste={(e) => {
              const text = e.clipboardData.getData('text');
              if (text && text.includes('\n')) {
                e.preventDefault();
                explodePaste(text);
              }
            }}
            onBlur={(e) => {
              if (e.target.value) explodePaste(e.target.value);
            }}
            rows={2}
            placeholder="1Z999AA10123456789&#10;TBA123456789&#10;OR&#10;1204, 1Z999AA10123456789"
            className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 font-mono text-[12.5px] text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:outline-none"
          />
        </div>

        {error && (
          <div className="border-error-200 bg-error-50 text-error-700 mt-3 rounded-xl border px-4 py-2.5 text-[13px]">
            {error}
          </div>
        )}
        {lastBatch !== null && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] text-emerald-700">
            <Check className="h-4 w-4" />
            Logged {lastBatch} package{lastBatch === 1 ? '' : 's'}. Run another courier or close.
          </div>
        )}

        {/* ROWS --------------------------------------------------------------- */}
        <div className="mt-4 flex flex-col gap-2">
          <div className="grid grid-cols-[110px_1fr_1fr_36px] gap-2 px-1 text-[10.5px] font-semibold tracking-[0.06em] text-neutral-400 uppercase">
            <span>Unit *</span>
            <span>Tracking #</span>
            <span>Description (optional)</span>
            <span />
          </div>
          {rows.map((row) => {
            const unmatched = !!row.unitInput && !row.unitId;
            return (
              <div key={row.rowId} className="grid grid-cols-[110px_1fr_1fr_36px] gap-2">
                <div className="relative">
                  <input
                    list={`fastlane-units-${row.rowId}`}
                    value={row.unitInput}
                    onChange={(e) => update(row.rowId, { unitInput: e.target.value })}
                    placeholder={unitsLoading ? '…' : 'Unit'}
                    className={`focus:ring-primary-100 h-9 w-full rounded-lg border px-2 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:outline-none ${
                      unmatched
                        ? 'border-rose-300 bg-rose-50'
                        : row.unitId
                          ? 'focus:border-primary-500 border-emerald-300 bg-emerald-50'
                          : 'focus:border-primary-500 border-neutral-200 bg-white'
                    }`}
                  />
                  <datalist id={`fastlane-units-${row.rowId}`}>
                    {units.map((u) => (
                      <option key={u.id} value={u.number} />
                    ))}
                  </datalist>
                </div>
                <input
                  value={row.trackingNumber}
                  onChange={(e) => update(row.rowId, { trackingNumber: e.target.value })}
                  placeholder="Tracking #"
                  className="focus:border-primary-500 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-2 font-mono text-[12.5px] text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:outline-none"
                />
                <input
                  value={row.description}
                  onChange={(e) => update(row.rowId, { description: e.target.value })}
                  placeholder="e.g. Large box, fragile"
                  className="focus:border-primary-500 focus:ring-primary-100 h-9 rounded-lg border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removeRow(row.rowId)}
                  className="flex h-9 items-center justify-center rounded-lg text-neutral-400 transition hover:bg-neutral-100 hover:text-rose-600"
                  disabled={rows.length <= 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
          {rows.length < 50 && (
            <button
              type="button"
              onClick={addRow}
              className="hover:border-primary-300 hover:text-primary-600 mt-1 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 py-2 text-[12.5px] font-medium text-neutral-500 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Add row
            </button>
          )}
        </div>

        {/* FOOTER ------------------------------------------------------------- */}
        <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
          <div className="flex flex-col gap-0.5 text-[12.5px]">
            <span className="font-medium text-neutral-700">
              {readyCount} ready to log · {courierLabel}
            </span>
            {unmatchedCount > 0 && (
              <span className="text-rose-600">
                {unmatchedCount} unit number{unmatchedCount === 1 ? '' : 's'} not found — fix or
                remove
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={submitting}>
              Done
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || readyCount === 0}
              className="bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-[0_2px_8px_rgba(245,158,11,0.4)] hover:from-amber-600 hover:to-orange-700"
            >
              {submitting ? 'Logging…' : `Log ${readyCount}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
