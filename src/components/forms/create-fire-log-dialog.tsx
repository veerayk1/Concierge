'use client';

/**
 * Fire Log Dialog — Critical gap feature for security console
 * Tracks fire alarms, FD response, and post-event procedures
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Flame } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/hooks/use-api';

// datetime-local inputs produce "YYYY-MM-DDTHH:mm" — not full ISO 8601
const datetimeLocalStr = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, 'Invalid date/time');
const optionalDatetime = z.string().optional().or(z.literal(''));

const fireLogSchema = z.object({
  alarmTime: datetimeLocalStr,
  alarmLocation: z.string().min(1, 'Alarm location is required').max(200),
  alarmType: z.enum(['smoke', 'heat', 'pull_station', 'sprinkler', 'other']),
  fdCallTime: optionalDatetime,
  announcementTime1: optionalDatetime,
  announcementTime2: optionalDatetime,
  announcementTime3: optionalDatetime,
  fdArrivalTime: optionalDatetime,
  allClearTime: optionalDatetime,
  fdDepartureTime: optionalDatetime,
  unlockLobby: z.boolean().default(false),
  holdElevators: z.boolean().default(false),
  sendRecall: z.boolean().default(false),
  ensureElevatorsReset: z.boolean().default(false),
  resetPullStation: z.boolean().default(false),
  resetSmokeDetector: z.boolean().default(false),
  resetHeatDetector: z.boolean().default(false),
  resetSprinklerHead: z.boolean().default(false),
  resetFirePanel: z.boolean().default(false),
  resetMagLocks: z.boolean().default(false),
  resetElevators: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
});

type FireLogInput = z.infer<typeof fireLogSchema>;

interface CreateFireLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

// Simple styled checkbox using native input
function NativeCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 accent-blue-600"
      />
      <span className="text-[14px] text-neutral-700">{label}</span>
    </label>
  );
}

export function CreateFireLogDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateFireLogDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FireLogInput>({
    resolver: zodResolver(fireLogSchema) as any,
    defaultValues: {
      alarmTime: new Date().toISOString().slice(0, 16),
      alarmLocation: '',
      alarmType: 'smoke',
      fdCallTime: new Date().toISOString().slice(0, 16),
      unlockLobby: true,
      holdElevators: true,
      sendRecall: false,
      ensureElevatorsReset: true,
      resetPullStation: false,
      resetSmokeDetector: false,
      resetHeatDetector: false,
      resetSprinklerHead: false,
      resetFirePanel: false,
      resetMagLocks: false,
      resetElevators: false,
      notes: '',
    },
  });

  async function onSubmit(data: FireLogInput) {
    setServerError(null);
    try {
      // Transform form field names to match API expectations
      const payload = {
        propertyId,
        alarmTime: data.alarmTime,
        alarmLocation: data.alarmLocation,
        alarmType: data.alarmType,
        fireDeptCallTime: data.fdCallTime || null,
        firstAnnouncementTime: data.announcementTime1 || null,
        secondAnnouncementTime: data.announcementTime2 || null,
        thirdAnnouncementTime: data.announcementTime3 || null,
        fireDeptArrivalTime: data.fdArrivalTime || null,
        fireDeptAllClearTime: data.allClearTime || null,
        fireDeptDepartureTime: data.fdDepartureTime || null,
        prepareForFdArrival: {
          unlockLobby: data.unlockLobby ?? false,
          holdElevators: data.holdElevators ?? false,
          sendRecall: data.sendRecall ?? false,
        },
        ensureElevatorsReset: {
          elevatorsReset: data.ensureElevatorsReset ?? false,
        },
        resetDevices: {
          pullStation: data.resetPullStation ?? false,
          smokeDetector: data.resetSmokeDetector ?? false,
          heatDetector: data.resetHeatDetector ?? false,
          sprinklerHead: data.resetSprinklerHead ?? false,
          firePanel: data.resetFirePanel ?? false,
          magLocks: data.resetMagLocks ?? false,
          elevators: data.resetElevators ?? false,
        },
        additionalNotes: data.notes || null,
      };
      const response = await apiRequest('/api/v1/security/fire-log', {
        method: 'POST',
        body: payload,
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setServerError(result.message || `Failed to create fire log (${response.status})`);
        return;
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setServerError('An unexpected error occurred.');
    }
  }

  const inputCls =
    'focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none';
  const smallInputCls =
    'focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[13px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none';

  const prepareFields: { field: keyof FireLogInput; label: string }[] = [
    { field: 'unlockLobby', label: 'Unlock lobby doors' },
    { field: 'holdElevators', label: 'Hold elevators on main floor' },
    { field: 'sendRecall', label: 'Send recall notification' },
  ];

  const resetFields: { field: keyof FireLogInput; label: string }[] = [
    { field: 'ensureElevatorsReset', label: 'Ensure Elevators Reset' },
    { field: 'resetPullStation', label: 'Pull Station' },
    { field: 'resetSmokeDetector', label: 'Smoke Detector' },
    { field: 'resetHeatDetector', label: 'Heat Detector' },
    { field: 'resetSprinklerHead', label: 'Sprinkler Head' },
    { field: 'resetFirePanel', label: 'Fire Panel' },
    { field: 'resetMagLocks', label: 'Magnetic Locks' },
    { field: 'resetElevators', label: 'Elevators' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Flame className="text-error-500 h-5 w-5" />
          Fire Event Log
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Document fire alarm response procedures and timeline.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          {/* Alarm Details */}
          <div className="border-neutral-200 rounded-xl border p-4 bg-neutral-50">
            <h3 className="mb-3 text-[14px] font-semibold text-neutral-900">Alarm Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">
                  Alarm Time<span className="text-error-500 ml-0.5">*</span>
                </label>
                <input type="datetime-local" {...register('alarmTime')} className={inputCls} />
                {errors.alarmTime && (
                  <span className="text-[12px] text-error-600">{errors.alarmTime.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">
                  Alarm Location<span className="text-error-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Lobby, 3rd Floor"
                  {...register('alarmLocation')}
                  className={inputCls}
                />
                {errors.alarmLocation && (
                  <span className="text-[12px] text-error-600">{errors.alarmLocation.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">
                  Alarm Type<span className="text-error-500 ml-0.5">*</span>
                </label>
                <select {...register('alarmType')} className={inputCls}>
                  <option value="smoke">Smoke Detector</option>
                  <option value="heat">Heat Detector</option>
                  <option value="pull_station">Pull Station</option>
                  <option value="sprinkler">Sprinkler Activation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">FD Call Time</label>
                <input type="datetime-local" {...register('fdCallTime')} className={inputCls} />
              </div>
            </div>
          </div>

          {/* Announcement Times */}
          <div className="border-neutral-200 rounded-xl border p-4 bg-neutral-50">
            <h3 className="mb-3 text-[14px] font-semibold text-neutral-900">Announcements</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { field: 'announcementTime1' as const, label: '1st Announcement' },
                { field: 'announcementTime2' as const, label: '2nd Announcement' },
                { field: 'announcementTime3' as const, label: '3rd Announcement' },
              ].map(({ field, label }) => (
                <div key={field} className="flex flex-col gap-2">
                  <label className="text-[14px] font-medium text-neutral-700">{label}</label>
                  <input type="datetime-local" {...register(field)} className={smallInputCls} />
                </div>
              ))}
            </div>
          </div>

          {/* FD Response Timeline */}
          <div className="border-neutral-200 rounded-xl border p-4 bg-neutral-50">
            <h3 className="mb-3 text-[14px] font-semibold text-neutral-900">FD Response</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { field: 'fdArrivalTime' as const, label: 'FD Arrival' },
                { field: 'allClearTime' as const, label: 'All-Clear' },
                { field: 'fdDepartureTime' as const, label: 'FD Departure' },
              ].map(({ field, label }) => (
                <div key={field} className="flex flex-col gap-2">
                  <label className="text-[14px] font-medium text-neutral-700">{label}</label>
                  <input type="datetime-local" {...register(field)} className={smallInputCls} />
                </div>
              ))}
            </div>
          </div>

          {/* Prepare for FD Arrival */}
          <div className="border-neutral-200 rounded-xl border p-4 bg-neutral-50">
            <h3 className="mb-3 text-[14px] font-semibold text-neutral-900">
              Prepare for FD Arrival
            </h3>
            <div className="flex flex-col gap-3">
              {prepareFields.map(({ field, label }) => (
                <NativeCheckbox
                  key={field}
                  checked={!!watch(field)}
                  onChange={(val) => setValue(field, val as any, { shouldValidate: true })}
                  label={label}
                />
              ))}
            </div>
          </div>

          {/* Device Resets */}
          <div className="border-neutral-200 rounded-xl border p-4 bg-neutral-50">
            <h3 className="mb-3 text-[14px] font-semibold text-neutral-900">Reset Devices</h3>
            <div className="grid grid-cols-2 gap-3">
              {resetFields.map(({ field, label }) => (
                <NativeCheckbox
                  key={field}
                  checked={!!watch(field)}
                  onChange={(val) => setValue(field, val as any, { shouldValidate: true })}
                  label={label}
                />
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Notes</label>
            <textarea
              {...register('notes')}
              placeholder="Additional details about the fire event..."
              className="focus:border-primary-500 focus:ring-primary-100 min-h-[120px] w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex gap-2 border-t border-neutral-200 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Logging...' : 'Log Fire Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
