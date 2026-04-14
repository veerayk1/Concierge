'use client';

/**
 * Edit Event Dialog — per PRD 13 Community Events
 *
 * Allows staff/admin to edit event details: title, description, date,
 * start/end time, location, category, capacity, and status.
 */

import { useState, useCallback, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/hooks/use-api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EventData {
  id: string;
  title: string;
  description?: string | null;
  date?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  category?: string | null;
  capacity?: number | null;
  status?: string | null;
}

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventData;
  onSuccess?: () => void;
}

const EVENT_STATUSES = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const;

const EVENT_CATEGORIES = [
  { value: 'social', label: 'Social' },
  { value: 'educational', label: 'Educational' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'other', label: 'Other' },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditEventDialog({ open, onOpenChange, event, onSuccess }: EditEventDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('social');
  const [capacity, setCapacity] = useState('');
  const [status, setStatus] = useState('upcoming');

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  // Populate form when dialog opens or event changes
  useEffect(() => {
    if (open && event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      // Parse date to YYYY-MM-DD for input[type=date]
      if (event.date) {
        try {
          const d = new Date(event.date);
          const parts = d.toISOString().split('T');
          setDate(parts[0] ?? '');
        } catch {
          setDate('');
        }
      } else {
        setDate('');
      }
      setStartTime(event.startTime || '');
      setEndTime(event.endTime || '');
      setLocation(event.location || '');
      setCategory(event.category || 'social');
      setCapacity(
        event.capacity !== null && event.capacity !== undefined ? String(event.capacity) : '',
      );
      setStatus(event.status || 'upcoming');
      setFeedback(null);
    }
  }, [open, event]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!event?.id) return;

      setSaving(true);
      setFeedback(null);

      try {
        const resp = await apiRequest(`/api/v1/events/${event.id}`, {
          method: 'PATCH',
          body: {
            title,
            description,
            date: date || null,
            startTime: startTime || null,
            endTime: endTime || null,
            location,
            category,
            capacity: capacity ? Number(capacity) : null,
            status,
          },
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          setFeedback({
            type: 'error',
            message: (err as { message?: string }).message || 'Failed to update event.',
          });
          setSaving(false);
          return;
        }

        setFeedback({ type: 'success', message: 'Event updated successfully.' });
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
      event,
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      category,
      capacity,
      status,
      onOpenChange,
      onSuccess,
    ],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Calendar className="text-primary-500 h-5 w-5" />
          Edit Event
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Update event details, schedule, and status.
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
          {/* Title */}
          <Input
            label="Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={saving}
          />

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={saving}
              placeholder="Describe the event..."
              rows={3}
              className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 hover:border-neutral-300 focus:ring-4 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Date + Status */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
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
                {EVENT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Time + End Time */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={saving}
            />
            <Input
              label="End Time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Location + Category */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Party Room"
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
                {EVENT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Capacity */}
          <Input
            label="Capacity"
            type="number"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Leave empty for unlimited"
            disabled={saving}
          />

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
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
