'use client';

/**
 * Edit Asset Dialog
 *
 * Allows admin to edit asset name, category, location, serial number,
 * status, purchase date, warranty expiry, and notes.
 */

import { useState, useCallback, useEffect } from 'react';
import { FileBox } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/hooks/use-api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AssetData {
  id: string;
  name: string;
  category: string;
  location: string;
  serialNumber: string;
  status: string;
  purchaseDate: string;
  warrantyExpiry: string;
  notes: string;
}

interface EditAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: AssetData;
  onSuccess?: () => void;
}

const CATEGORIES = [
  { value: 'furniture', label: 'Furniture' },
  { value: 'appliance', label: 'Appliance' },
  { value: 'fixture', label: 'Fixture' },
  { value: 'technology', label: 'Technology' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'tool', label: 'Tool' },
  { value: 'infrastructure', label: 'Infrastructure' },
] as const;

const STATUSES = [
  { value: 'in_service', label: 'In Service' },
  { value: 'storage', label: 'Storage' },
  { value: 'repair', label: 'Repair' },
  { value: 'disposed', label: 'Disposed' },
  { value: 'on_order', label: 'On Order' },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditAssetDialog({ open, onOpenChange, asset, onSuccess }: EditAssetDialogProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('furniture');
  const [location, setLocation] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [status, setStatus] = useState('in_service');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  useEffect(() => {
    if (open && asset) {
      setName(asset.name || '');
      setCategory(asset.category || 'furniture');
      setLocation(asset.location || '');
      setSerialNumber(asset.serialNumber || '');
      setStatus(asset.status || 'in_service');
      setPurchaseDate(asset.purchaseDate ? asset.purchaseDate.slice(0, 10) : '');
      setWarrantyExpiry(asset.warrantyExpiry ? asset.warrantyExpiry.slice(0, 10) : '');
      setNotes(asset.notes || '');
      setFeedback(null);
    }
  }, [open, asset]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!asset?.id) return;

      setSaving(true);
      setFeedback(null);

      try {
        const resp = await apiRequest(`/api/v1/assets/${asset.id}`, {
          method: 'PATCH',
          body: {
            name,
            category,
            location: location || null,
            serialNumber: serialNumber || null,
            status,
            purchaseDate: purchaseDate || null,
            warrantyExpiry: warrantyExpiry || null,
            notes: notes || null,
          },
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          setFeedback({
            type: 'error',
            message: (err as { message?: string }).message || 'Failed to update asset.',
          });
          setSaving(false);
          return;
        }

        setFeedback({ type: 'success', message: 'Asset updated successfully.' });
        setTimeout(() => {
          onOpenChange(false);
          onSuccess?.();
        }, 1000);
      } catch {
        setFeedback({ type: 'error', message: 'An unexpected error occurred.' });
      } finally {
        setSaving(false);
      }
    },
    [
      asset,
      name,
      category,
      location,
      serialNumber,
      status,
      purchaseDate,
      warrantyExpiry,
      notes,
      onOpenChange,
      onSuccess,
    ],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <FileBox className="text-primary-500 h-5 w-5" />
          Edit Asset
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Update asset details, status, and warranty information.
        </DialogDescription>

        {feedback && (
          <div
            className={`mt-4 rounded-lg px-4 py-3 text-[14px] font-medium ${
              feedback.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
            role="alert"
          >
            {feedback.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5" noValidate>
          <Input
            label="Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={saving}
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={saving}
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none disabled:opacity-50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={saving}
              placeholder="e.g. Lobby, 3rd Floor"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Serial Number"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              disabled={saving}
            />

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={saving}
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none disabled:opacity-50"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Purchase Date"
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              disabled={saving}
            />
            <Input
              label="Warranty Expiry"
              type="date"
              value={warrantyExpiry}
              onChange={(e) => setWarrantyExpiry(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={saving}
              placeholder="Any additional notes..."
              rows={3}
              className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 hover:border-neutral-300 focus:ring-4 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Actions */}
          <div className="mt-2 flex justify-end gap-3 border-t border-neutral-100 pt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
