'use client';

/**
 * Create Announcement Dialog — per PRD 09 Communication
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Megaphone } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(10, 'Content must be at least 10 characters').max(10000),
  category: z.enum(['general', 'maintenance', 'safety', 'community', 'policy', 'event']),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  channels: z.object({
    email: z.boolean().default(false),
    sms: z.boolean().default(false),
    push: z.boolean().default(false),
    lobby_display: z.boolean().default(false),
  }),
  targetAudience: z.enum(['all_residents', 'specific_floors', 'specific_units', 'staff_only']),
  scheduleForLater: z.boolean().default(false),
  scheduledAt: z.string().optional(),
});

type AnnouncementInput = z.infer<typeof announcementSchema>;

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'safety', label: 'Safety' },
  { value: 'community', label: 'Community' },
  { value: 'policy', label: 'Policy' },
  { value: 'event', label: 'Event' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Important' },
  { value: 'urgent', label: 'Urgent' },
];

const TARGET_AUDIENCES = [
  { value: 'all_residents', label: 'All Residents' },
  { value: 'specific_floors', label: 'Specific Floors' },
  { value: 'specific_units', label: 'Specific Units' },
  { value: 'staff_only', label: 'Staff Only' },
];

interface CreateAnnouncementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateAnnouncementDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateAnnouncementDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AnnouncementInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(announcementSchema) as any,
    defaultValues: {
      title: '',
      content: '',
      category: 'general',
      priority: 'normal',
      channels: { email: false, sms: false, push: false, lobby_display: false },
      targetAudience: 'all_residents',
      scheduleForLater: false,
      scheduledAt: '',
    },
  });

  const channels = watch('channels');
  const scheduleForLater = watch('scheduleForLater');

  const selectClass =
    'focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none';
  const selectErrorClass =
    'focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-error-300 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none';
  const textareaBase =
    'w-full rounded-xl border bg-white px-4 py-3 text-[15px] leading-relaxed text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none';
  const textareaDefault =
    'focus:border-primary-500 focus:ring-primary-100 border-neutral-200 hover:border-neutral-300';
  const textareaError = 'border-error-300 focus:border-error-500 focus:ring-error-100';

  async function onSubmit(data: AnnouncementInput) {
    setServerError(null);
    try {
      const channelList = Object.entries(data.channels)
        .filter(([, v]) => v)
        .map(([k]) => (k === 'lobby_display' ? 'web' : k));

      // Ensure at least one channel is selected
      const channels = channelList.length > 0 ? channelList : ['web'];

      const response = await fetch('/api/v1/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('demo_role')
            ? { 'x-demo-role': localStorage.getItem('demo_role')! }
            : {}),
        },
        body: JSON.stringify({
          propertyId,
          title: data.title,
          content: data.content,
          priority: data.priority,
          channels,
          status: data.scheduleForLater ? 'scheduled' : 'published',
          scheduledAt:
            data.scheduleForLater && data.scheduledAt
              ? new Date(data.scheduledAt).toISOString()
              : undefined,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        setServerError(result.message || 'Failed to create announcement');
        return;
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setServerError('An unexpected error occurred.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Megaphone className="text-primary-500 h-5 w-5" />
          New Announcement
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Create and distribute an announcement to residents and staff.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          <Input
            {...register('title')}
            label="Title"
            placeholder="e.g. Fire Alarm Testing — March 20th"
            required
            error={errors.title?.message}
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Content<span className="text-error-500 ml-0.5">*</span>
            </label>
            <textarea
              {...register('content')}
              placeholder="Write your announcement content..."
              rows={5}
              className={`${textareaBase} ${errors.content ? textareaError : textareaDefault}`}
              maxLength={10000}
            />
            {errors.content && (
              <p className="text-error-600 text-[13px] font-medium">{errors.content.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Category<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('category')}
                className={errors.category ? selectErrorClass : selectClass}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-error-600 text-[13px] font-medium">{errors.category.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Priority<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('priority')}
                className={errors.priority ? selectErrorClass : selectClass}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
              {errors.priority && (
                <p className="text-error-600 text-[13px] font-medium">{errors.priority.message}</p>
              )}
            </div>
          </div>

          {/* Distribution Channels */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Distribution Channels
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'email' as const, label: 'Email' },
                { key: 'sms' as const, label: 'SMS' },
                { key: 'push' as const, label: 'Push Notification' },
                { key: 'lobby_display' as const, label: 'Lobby Display' },
              ].map((ch) => (
                <div
                  key={ch.key}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                    channels[ch.key]
                      ? 'border-primary-200 bg-primary-50/30'
                      : 'border-neutral-200 bg-white'
                  }`}
                >
                  <Checkbox
                    checked={channels[ch.key]}
                    onCheckedChange={(c) => setValue(`channels.${ch.key}`, c === true)}
                    id={`channel-${ch.key}`}
                  />
                  <label
                    htmlFor={`channel-${ch.key}`}
                    className="cursor-pointer text-[14px] font-medium text-neutral-900"
                  >
                    {ch.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Target Audience */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Target Audience<span className="text-error-500 ml-0.5">*</span>
            </label>
            <select
              {...register('targetAudience')}
              className={errors.targetAudience ? selectErrorClass : selectClass}
            >
              {TARGET_AUDIENCES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            {errors.targetAudience && (
              <p className="text-error-600 text-[13px] font-medium">
                {errors.targetAudience.message}
              </p>
            )}
          </div>

          {/* Schedule */}
          <div className="flex flex-col gap-3">
            <Checkbox
              checked={scheduleForLater}
              onCheckedChange={(c) => setValue('scheduleForLater', c === true)}
              label="Schedule for later"
              id="schedule-for-later"
            />
            {scheduleForLater && (
              <Input
                {...register('scheduledAt')}
                type="datetime-local"
                label="Scheduled Date & Time"
                error={errors.scheduledAt?.message}
              />
            )}
          </div>

          {/* Actions */}
          <div className="mt-2 flex items-center justify-end gap-3 border-t border-neutral-100 pt-5">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
              {isSubmitting ? 'Publishing...' : 'Publish Announcement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
