'use client';

/**
 * Edit Amenity Dialog — per PRD 06 Amenity Management
 *
 * Allows staff/admin to edit amenity details: name, description, location,
 * capacity, fee, security deposit, approval settings, hours, rules, and
 * max concurrent bookings.
 */

import { useState, useCallback, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { apiRequest } from '@/lib/hooks/use-api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AmenityData {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  capacity?: number | null;
  fee?: number | null;
  securityDeposit?: number | null;
  requiresApproval?: boolean;
  approvalMode?: string | null;
  maxConcurrent?: number | null;
  openTime?: string | null;
  closeTime?: string | null;
  rules?: string[] | null;
  isActive?: boolean;
}

interface EditAmenityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amenity: AmenityData;
  onSuccess?: () => void;
}

const APPROVAL_MODES = [
  { value: 'auto', label: 'Auto-Approve' },
  { value: 'manual', label: 'Manual Approval' },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditAmenityDialog({
  open,
  onOpenChange,
  amenity,
  onSuccess,
}: EditAmenityDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');
  const [fee, setFee] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [approvalMode, setApprovalMode] = useState('auto');
  const [maxConcurrent, setMaxConcurrent] = useState('');
  const [openTime, setOpenTime] = useState('');
  const [closeTime, setCloseTime] = useState('');
  const [rulesText, setRulesText] = useState('');

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  // Populate form when dialog opens or amenity changes
  useEffect(() => {
    if (open && amenity) {
      setName(amenity.name || '');
      setDescription(amenity.description || '');
      setLocation(amenity.location || '');
      setCapacity(
        amenity.capacity !== null && amenity.capacity !== undefined ? String(amenity.capacity) : '',
      );
      setFee(amenity.fee !== null && amenity.fee !== undefined ? String(amenity.fee) : '');
      setSecurityDeposit(
        amenity.securityDeposit !== null && amenity.securityDeposit !== undefined
          ? String(amenity.securityDeposit)
          : '',
      );
      setRequiresApproval(amenity.requiresApproval ?? false);
      setApprovalMode(amenity.approvalMode || 'auto');
      setMaxConcurrent(
        amenity.maxConcurrent !== null && amenity.maxConcurrent !== undefined
          ? String(amenity.maxConcurrent)
          : '',
      );
      setOpenTime(amenity.openTime || '');
      setCloseTime(amenity.closeTime || '');
      setRulesText((amenity.rules ?? []).join('\n'));
      setFeedback(null);
    }
  }, [open, amenity]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!amenity?.id) return;

      setSaving(true);
      setFeedback(null);

      try {
        const resp = await apiRequest(`/api/v1/amenities/${amenity.id}`, {
          method: 'PATCH',
          body: {
            name,
            description,
            location,
            capacity: capacity ? Number(capacity) : null,
            fee: fee ? Number(fee) : null,
            securityDeposit: securityDeposit ? Number(securityDeposit) : null,
            requiresApproval,
            approvalMode,
            maxConcurrent: maxConcurrent ? Number(maxConcurrent) : null,
            openTime: openTime || null,
            closeTime: closeTime || null,
            rules: rulesText.trim()
              ? rulesText
                  .split('\n')
                  .map((r) => r.trim())
                  .filter(Boolean)
              : [],
          },
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          setFeedback({
            type: 'error',
            message: (err as { message?: string }).message || 'Failed to update amenity.',
          });
          setSaving(false);
          return;
        }

        setFeedback({ type: 'success', message: 'Amenity updated successfully.' });
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
      amenity,
      name,
      description,
      location,
      capacity,
      fee,
      securityDeposit,
      requiresApproval,
      approvalMode,
      maxConcurrent,
      openTime,
      closeTime,
      rulesText,
      onOpenChange,
      onSuccess,
    ],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Calendar className="text-primary-500 h-5 w-5" />
          Edit Amenity
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Update amenity details, rates, hours, and rules.
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
          {/* Name + Location */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />
            <Input
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. 2nd Floor"
              disabled={saving}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
              placeholder="Describe the amenity..."
              rows={3}
              className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 hover:border-neutral-300 focus:ring-4 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Capacity + Max Concurrent */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Capacity"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="e.g. 50"
              disabled={saving}
            />
            <Input
              label="Max Concurrent Bookings"
              type="number"
              value={maxConcurrent}
              onChange={(e) => setMaxConcurrent(e.target.value)}
              placeholder="e.g. 1"
              disabled={saving}
            />
          </div>

          {/* Rates Section */}
          <div>
            <p className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
              Rates
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Booking Fee ($)"
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="0.00"
                disabled={saving}
              />
              <Input
                label="Security Deposit ($)"
                type="number"
                value={securityDeposit}
                onChange={(e) => setSecurityDeposit(e.target.value)}
                placeholder="0.00"
                disabled={saving}
              />
            </div>
          </div>

          {/* Hours */}
          <div>
            <p className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
              Operating Hours
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Open Time"
                type="time"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
                disabled={saving}
              />
              <Input
                label="Close Time"
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          {/* Approval */}
          <div>
            <p className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
              Approval Settings
            </p>
            <div className="flex flex-col gap-3">
              <Checkbox
                checked={requiresApproval}
                onCheckedChange={(c) => setRequiresApproval(c === true)}
                label="Requires Approval"
                description="Bookings must be approved by staff before confirmation"
                id="requires-approval"
              />
              {requiresApproval && (
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-medium text-neutral-700">Approval Mode</label>
                  <select
                    value={approvalMode}
                    onChange={(e) => setApprovalMode(e.target.value)}
                    disabled={saving}
                    className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none disabled:opacity-50"
                  >
                    {APPROVAL_MODES.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Rules */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Rules &amp; Guidelines
            </label>
            <textarea
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              disabled={saving}
              placeholder="One rule per line..."
              rows={4}
              className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 hover:border-neutral-300 focus:ring-4 focus:outline-none disabled:opacity-50"
            />
            <p className="text-[12px] text-neutral-400">Enter one rule per line.</p>
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
