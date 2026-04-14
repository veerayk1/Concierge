'use client';

/**
 * Edit Building Directory Entry Dialog
 *
 * Allows admin to edit directory entry name, category, contact info,
 * location, hours, and description/notes.
 */

import { useState, useCallback, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/hooks/use-api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DirectoryEntryData {
  id: string;
  name: string;
  category: string;
  phone: string;
  email: string;
  contactPerson: string;
  location: string;
  hoursOfOperation: string;
  hours?: string;
  notes: string;
}

interface EditDirectoryEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: DirectoryEntryData;
  onSuccess?: () => void;
}

const CATEGORIES = [
  { value: 'management', label: 'Management' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'amenity', label: 'Amenity' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'utility', label: 'Utility' },
  { value: 'service', label: 'Service' },
  { value: 'security', label: 'Security' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'common_area', label: 'Common Area' },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditDirectoryEntryDialog({
  open,
  onOpenChange,
  entry,
  onSuccess,
}: EditDirectoryEntryDialogProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('service');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [hoursOfOperation, setHoursOfOperation] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  useEffect(() => {
    if (open && entry) {
      setName(entry.name || '');
      setCategory(entry.category || 'service');
      setContactPerson(entry.contactPerson || '');
      setPhone(entry.phone || '');
      setEmail(entry.email || '');
      setLocation(entry.location || '');
      setHoursOfOperation(entry.hoursOfOperation || entry.hours || '');
      setNotes(entry.notes || '');
      setFeedback(null);
    }
  }, [open, entry]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!entry?.id) return;

      setSaving(true);
      setFeedback(null);

      try {
        const resp = await apiRequest(`/api/v1/building-directory/${entry.id}`, {
          method: 'PATCH',
          body: {
            name,
            category,
            contactPerson: contactPerson || null,
            phone: phone || null,
            email: email || null,
            location: location || null,
            hoursOfOperation: hoursOfOperation || null,
            notes: notes || null,
          },
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          setFeedback({
            type: 'error',
            message: (err as { message?: string }).message || 'Failed to update entry.',
          });
          setSaving(false);
          return;
        }

        setFeedback({ type: 'success', message: 'Directory entry updated successfully.' });
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
      entry,
      name,
      category,
      contactPerson,
      phone,
      email,
      location,
      hoursOfOperation,
      notes,
      onOpenChange,
      onSuccess,
    ],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Building2 className="text-primary-500 h-5 w-5" />
          Edit Directory Entry
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Update directory entry details and contact information.
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
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
            />

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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Person"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              disabled={saving}
            />
            <Input
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={saving}
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={saving}
          />

          <Input
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={saving}
            placeholder="e.g. Lobby, Unit 101"
          />

          <Input
            label="Hours of Operation"
            value={hoursOfOperation}
            onChange={(e) => setHoursOfOperation(e.target.value)}
            disabled={saving}
            placeholder="e.g. Mon-Fri 9am-5pm"
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={saving}
              placeholder="Additional notes about this entry..."
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
