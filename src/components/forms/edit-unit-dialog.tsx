'use client';

/**
 * Edit Unit Dialog — per PRD 07 Unit Management
 *
 * Allows staff/admin to edit unit details: number, floor, type, status,
 * square footage, enter phone code, parking spot, locker, key tag,
 * package notifications, and comments.
 */

import { useState, useCallback, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { apiRequest } from '@/lib/hooks/use-api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UnitData {
  id: string;
  number: string;
  floor: number | null;
  unitType?: string;
  type?: string;
  status: string;
  sqft?: number | string | null;
  squareFootage?: number | string | null;
  enterPhoneCode?: string | null;
  parkingSpot?: string | null;
  locker?: string | null;
  keyTag?: string | null;
  packageEmailNotification?: boolean;
  comments?: string | null;
}

interface EditUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit: UnitData;
  onSuccess?: () => void;
}

const UNIT_TYPES = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'storage', label: 'Storage' },
  { value: 'parking', label: 'Parking' },
] as const;

const UNIT_STATUSES = [
  { value: 'occupied', label: 'Occupied' },
  { value: 'vacant', label: 'Vacant' },
  { value: 'under_renovation', label: 'Under Renovation' },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditUnitDialog({ open, onOpenChange, unit, onSuccess }: EditUnitDialogProps) {
  const [number, setNumber] = useState('');
  const [floor, setFloor] = useState('');
  const [unitType, setUnitType] = useState('residential');
  const [status, setStatus] = useState('occupied');
  const [squareFootage, setSquareFootage] = useState('');
  const [enterPhoneCode, setEnterPhoneCode] = useState('');
  const [parkingSpot, setParkingSpot] = useState('');
  const [locker, setLocker] = useState('');
  const [keyTag, setKeyTag] = useState('');
  const [packageEmailNotification, setPackageEmailNotification] = useState(true);
  const [comments, setComments] = useState('');

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  // Populate form when dialog opens or unit changes
  useEffect(() => {
    if (open && unit) {
      setNumber(unit.number || '');
      setFloor(unit.floor !== null && unit.floor !== undefined ? String(unit.floor) : '');
      setUnitType(unit.unitType || unit.type || 'residential');
      setStatus(unit.status || 'occupied');
      const sqft = unit.squareFootage ?? unit.sqft;
      setSquareFootage(sqft !== null && sqft !== undefined ? String(sqft) : '');
      setEnterPhoneCode(unit.enterPhoneCode || '');
      setParkingSpot(unit.parkingSpot || '');
      setLocker(unit.locker || '');
      setKeyTag(unit.keyTag || '');
      setPackageEmailNotification(unit.packageEmailNotification ?? true);
      setComments(unit.comments || '');
      setFeedback(null);
    }
  }, [open, unit]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!unit?.id) return;

      setSaving(true);
      setFeedback(null);

      try {
        const resp = await apiRequest(`/api/v1/units/${unit.id}`, {
          method: 'PATCH',
          body: {
            number,
            floor: floor ? Number(floor) : null,
            unitType,
            status,
            squareFootage: squareFootage ? Number(squareFootage) : null,
            enterPhoneCode,
            parkingSpot,
            locker,
            keyTag,
            packageEmailNotification,
            comments,
          },
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          setFeedback({
            type: 'error',
            message: (err as { message?: string }).message || 'Failed to update unit.',
          });
          setSaving(false);
          return;
        }

        setFeedback({ type: 'success', message: 'Unit updated successfully.' });
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
      unit,
      number,
      floor,
      unitType,
      status,
      squareFootage,
      enterPhoneCode,
      parkingSpot,
      locker,
      keyTag,
      packageEmailNotification,
      comments,
      onOpenChange,
      onSuccess,
    ],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Building2 className="text-primary-500 h-5 w-5" />
          Edit Unit {unit?.number}
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Update unit details, access codes, and settings.
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
          {/* Unit Number + Floor */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Unit Number"
              required
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              disabled={saving}
            />
            <Input
              label="Floor"
              type="number"
              value={floor}
              onChange={(e) => setFloor(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Unit Type</label>
              <select
                value={unitType}
                onChange={(e) => setUnitType(e.target.value)}
                disabled={saving}
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none disabled:opacity-50"
              >
                {UNIT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={saving}
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none disabled:opacity-50"
              >
                {UNIT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Square Footage */}
          <Input
            label="Square Footage"
            type="number"
            value={squareFootage}
            onChange={(e) => setSquareFootage(e.target.value)}
            placeholder="e.g. 850"
            disabled={saving}
          />

          {/* Access Codes Section */}
          <div>
            <p className="mb-3 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
              Access &amp; Facilities
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Enter Phone Code"
                value={enterPhoneCode}
                onChange={(e) => setEnterPhoneCode(e.target.value)}
                placeholder="e.g. 1234"
                disabled={saving}
              />
              <Input
                label="Key Tag"
                value={keyTag}
                onChange={(e) => setKeyTag(e.target.value)}
                placeholder="e.g. A-501"
                disabled={saving}
              />
              <Input
                label="Parking Spot"
                value={parkingSpot}
                onChange={(e) => setParkingSpot(e.target.value)}
                placeholder="e.g. P2-45"
                disabled={saving}
              />
              <Input
                label="Locker"
                value={locker}
                onChange={(e) => setLocker(e.target.value)}
                placeholder="e.g. L-12"
                disabled={saving}
              />
            </div>
          </div>

          {/* Notifications */}
          <Checkbox
            checked={packageEmailNotification}
            onCheckedChange={(c) => setPackageEmailNotification(c === true)}
            label="Package Email Notifications"
            description="Send email notifications to residents when packages arrive"
            id="pkg-email-notif"
          />

          {/* Comments */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Notes / Comments</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              disabled={saving}
              placeholder="Internal notes about this unit..."
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
            <Button type="submit" disabled={saving || !number.trim()}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
