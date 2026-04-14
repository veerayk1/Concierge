'use client';

/**
 * Edit Announcement Dialog
 *
 * Allows admin to edit announcement title, body, category, priority, and status.
 */

import { useState, useCallback, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/hooks/use-api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnnouncementData {
  id: string;
  title: string;
  body: string;
  category: string;
  priority: string;
  status: string;
}

interface EditAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  announcement: AnnouncementData;
  onSuccess?: () => void;
}

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'safety', label: 'Safety' },
  { value: 'event', label: 'Event' },
  { value: 'policy', label: 'Policy' },
  { value: 'emergency', label: 'Emergency' },
] as const;

const PRIORITIES = [
  { value: 'normal', label: 'Normal' },
  { value: 'important', label: 'Important' },
  { value: 'urgent', label: 'Urgent' },
] as const;

const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EditAnnouncementDialog({
  open,
  onOpenChange,
  announcement,
  onSuccess,
}: EditAnnouncementDialogProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('general');
  const [priority, setPriority] = useState('normal');
  const [status, setStatus] = useState('draft');

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  useEffect(() => {
    if (open && announcement) {
      setTitle(announcement.title || '');
      // Strip HTML tags for editing as plain text
      setBody((announcement.body || '').replace(/<[^>]*>/g, ''));
      setCategory(announcement.category || 'general');
      setPriority(announcement.priority || 'normal');
      setStatus(announcement.status || 'draft');
      setFeedback(null);
    }
  }, [open, announcement]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!announcement?.id) return;

      setSaving(true);
      setFeedback(null);

      try {
        const resp = await apiRequest(`/api/v1/announcements/${announcement.id}`, {
          method: 'PATCH',
          body: {
            title,
            body,
            category,
            priority,
            status,
          },
        });

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          setFeedback({
            type: 'error',
            message: (err as { message?: string }).message || 'Failed to update announcement.',
          });
          setSaving(false);
          return;
        }

        setFeedback({ type: 'success', message: 'Announcement updated successfully.' });
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
    [announcement, title, body, category, priority, status, onOpenChange, onSuccess],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Bell className="text-primary-500 h-5 w-5" />
          Edit Announcement
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Update announcement content, category, and priority.
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
            label="Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={saving}
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={saving}
              placeholder="Announcement content..."
              rows={6}
              className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 hover:border-neutral-300 focus:ring-4 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
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

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={saving}
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none disabled:opacity-50"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
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
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
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
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
