'use client';

/**
 * Create Announcement Dialog — per PRD 09 Communication
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Megaphone, Send, Smartphone } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  body: z.string().min(1, 'Body is required').max(10000),
  priority: z.enum(['normal', 'important', 'urgent']).default('normal'),
  channels: z.object({
    web: z.boolean().default(true),
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    push: z.boolean().default(true),
  }),
  status: z.enum(['draft', 'published']).default('draft'),
});

type AnnouncementFormInput = z.infer<typeof announcementSchema>;

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
  } = useForm<AnnouncementFormInput>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      body: '',
      priority: 'normal',
      channels: { web: true, email: true, sms: false, push: true },
      status: 'draft',
    },
  });

  const channels = watch('channels');
  const priority = watch('priority');

  async function onSubmit(data: AnnouncementFormInput) {
    setServerError(null);
    try {
      const channelList = Object.entries(data.channels)
        .filter(([, v]) => v)
        .map(([k]) => k);

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
          body: data.body,
          priority: data.priority,
          channels: channelList,
          status: data.status,
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
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
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
              Body<span className="text-error-500 ml-0.5">*</span>
            </label>
            <textarea
              {...register('body')}
              placeholder="Write your announcement..."
              rows={6}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-[15px] leading-relaxed text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none ${
                errors.body
                  ? 'border-error-300 focus:border-error-500 focus:ring-error-100'
                  : 'focus:border-primary-500 focus:ring-primary-100 border-neutral-200 hover:border-neutral-300'
              }`}
            />
            {errors.body && (
              <p className="text-error-600 text-[13px] font-medium">{errors.body.message}</p>
            )}
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Priority</label>
            <div className="flex gap-2">
              {(['normal', 'important', 'urgent'] as const).map((p) => {
                const colors = {
                  normal: 'bg-neutral-100 text-neutral-600',
                  important: 'bg-warning-50 text-warning-700',
                  urgent: 'bg-error-50 text-error-700',
                };
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setValue('priority', p)}
                    className={`flex-1 rounded-xl py-2 text-[13px] font-semibold capitalize transition-all ${
                      priority === p
                        ? 'ring-primary-500 ring-2 ' + colors[p]
                        : colors[p] + ' opacity-60'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Channels */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Distribution Channels
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  key: 'web' as const,
                  label: 'Web Portal',
                  icon: Megaphone,
                  desc: 'Show on dashboard and announcements page',
                },
                {
                  key: 'email' as const,
                  label: 'Email',
                  icon: Mail,
                  desc: 'Send to all residents via email',
                },
                {
                  key: 'sms' as const,
                  label: 'SMS',
                  icon: Smartphone,
                  desc: 'Send text message to residents',
                },
                { key: 'push' as const, label: 'Push', icon: Send, desc: 'Send push notification' },
              ].map((ch) => (
                <div
                  key={ch.key}
                  className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${
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
                  <div>
                    <p className="text-[14px] font-medium text-neutral-900">{ch.label}</p>
                    <p className="text-[12px] text-neutral-500">{ch.desc}</p>
                  </div>
                </div>
              ))}
            </div>
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
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setValue('status', 'draft');
                handleSubmit(onSubmit)();
              }}
              disabled={isSubmitting}
            >
              Save as Draft
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
              onClick={() => setValue('status', 'published')}
            >
              {isSubmitting ? 'Publishing...' : 'Publish Now'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
