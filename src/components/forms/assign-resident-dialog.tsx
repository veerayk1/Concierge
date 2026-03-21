'use client';

/**
 * Assign Resident to Unit Dialog
 * Links a resident to a unit via OccupancyRecord.
 */

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, UserPlus } from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';

interface AssignResidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  /** Pre-fill unit if opened from unit detail */
  unitId?: string;
  unitNumber?: string;
  /** Pre-fill resident if opened from resident detail */
  userId?: string;
  userName?: string;
  onSuccess?: () => void;
}

interface ListItem {
  id: string;
  label: string;
  subtitle?: string;
}

export function AssignResidentDialog({
  open,
  onOpenChange,
  propertyId,
  unitId: prefillUnitId,
  unitNumber: prefillUnitNumber,
  userId: prefillUserId,
  userName: prefillUserName,
  onSuccess,
}: AssignResidentDialogProps) {
  const [selectedUnit, setSelectedUnit] = useState(prefillUnitId || '');
  const [selectedUser, setSelectedUser] = useState(prefillUserId || '');
  const [residentType, setResidentType] = useState('tenant');
  const [moveInDate, setMoveInDate] = useState(new Date().toISOString().split('T')[0]);
  const [isPrimary, setIsPrimary] = useState(true);
  const [notes, setNotes] = useState('');
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch units and residents for dropdowns
  const { data: unitsData } = useApi<{ data: Array<{ id: string; number: string }> }>(
    open && !prefillUnitId ? apiUrl('/api/v1/units', { propertyId, pageSize: '500' }) : null,
  );

  const { data: usersData } = useApi<{
    data: Array<{ id: string; firstName: string; lastName: string; email: string }>;
  }>(open && !prefillUserId ? apiUrl('/api/v1/users', { propertyId, pageSize: '500' }) : null);

  useEffect(() => {
    if (open) {
      setSelectedUnit(prefillUnitId || '');
      setSelectedUser(prefillUserId || '');
      setResidentType('tenant');
      setMoveInDate(new Date().toISOString().split('T')[0]);
      setIsPrimary(true);
      setNotes('');
      setServerError(null);
    }
  }, [open, prefillUnitId, prefillUserId]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setServerError(null);
      setIsSubmitting(true);

      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/v1/occupancy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(localStorage.getItem('demo_role') && {
              'x-demo-role': localStorage.getItem('demo_role')!,
            }),
          },
          body: JSON.stringify({
            unitId: selectedUnit,
            userId: selectedUser,
            propertyId,
            residentType,
            moveInDate,
            isPrimary,
            notes: notes || null,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          setServerError(err.message || 'Failed to assign resident');
          setIsSubmitting(false);
          return;
        }

        setIsSubmitting(false);
        onOpenChange(false);
        onSuccess?.();
      } catch {
        setServerError('Network error');
        setIsSubmitting(false);
      }
    },
    [
      selectedUnit,
      selectedUser,
      propertyId,
      residentType,
      moveInDate,
      isPrimary,
      notes,
      onOpenChange,
      onSuccess,
    ],
  );

  const units: ListItem[] =
    unitsData?.data?.map((u) => ({ id: u.id, label: `Unit ${u.number}` })) ?? [];
  const users: ListItem[] =
    usersData?.data?.map((u) => ({
      id: u.id,
      label: `${u.firstName} ${u.lastName}`,
      subtitle: u.email,
    })) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle>Assign Resident to Unit</DialogTitle>
        <DialogDescription>Link a resident to a unit with move-in details.</DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-4">
          {serverError && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p>
          )}

          {/* Unit selector */}
          {prefillUnitId ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Unit</label>
              <Input value={prefillUnitNumber || 'Selected unit'} disabled />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Unit <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                required
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm"
              >
                <option value="">Select a unit...</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Resident selector */}
          {prefillUserId ? (
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Resident</label>
              <Input value={prefillUserName || 'Selected resident'} disabled />
            </div>
          ) : (
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Resident <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                required
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm"
              >
                <option value="">Select a resident...</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label} ({u.subtitle})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Resident Type */}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Resident Type</label>
            <select
              value={residentType}
              onChange={(e) => setResidentType(e.target.value)}
              className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm"
            >
              <option value="owner">Owner</option>
              <option value="tenant">Tenant</option>
              <option value="offsite_owner">Offsite Owner</option>
              <option value="family_member">Family Member</option>
            </select>
          </div>

          {/* Move-in Date */}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Move-in Date</label>
            <Input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} />
          </div>

          {/* Primary Resident */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300"
            />
            <span className="text-sm text-neutral-700">Primary contact for this unit</span>
          </label>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm font-medium text-neutral-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              maxLength={500}
              rows={2}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm placeholder:text-neutral-400"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !selectedUnit || !selectedUser}
            className="w-full"
          >
            {isSubmitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            Assign Resident
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
