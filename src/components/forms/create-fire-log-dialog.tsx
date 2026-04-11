'use client';

/**
 * Fire Log Dialog — Complete per docs/logs.md spec
 * Gap 3.1: All 7 missing fields now implemented:
 *   1. Log Title
 *   2. Related Unit dropdown
 *   3. Correct "Prepare for FD Arrival" checklist (Fire Safety Plan, FD Keys, Residents needing assistance)
 *   4. "Ensure elevators respond" as 4 individual checkboxes
 *   5. Fire Log Details textarea (pre-filled "Full Report to Follow...")
 *   6. Send Copy email recipients
 *   7. File attachments (max 4)
 */

import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Flame, Paperclip, X } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiRequest, useApi, apiUrl } from '@/lib/hooks/use-api';

// datetime-local inputs produce "YYYY-MM-DDTHH:mm" — not full ISO 8601
const datetimeLocalStr = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, 'Invalid date/time');
const optionalDatetime = z.string().optional().or(z.literal(''));

const fireLogSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  unitId: z.string().optional(),
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
  // Prepare for FD Arrival — correct items per docs/logs.md
  fireSafetyPlan: z.boolean().default(false),
  fireDeptKeys: z.boolean().default(false),
  residentsNeedingAssistance: z.boolean().default(false),
  // Ensure elevators respond — 4 individual elevators per docs/logs.md
  elevator1: z.boolean().default(false),
  elevator2: z.boolean().default(false),
  elevator3: z.boolean().default(false),
  elevator4: z.boolean().default(false),
  // Reset electronic devices (unchanged — already correct)
  resetPullStation: z.boolean().default(false),
  resetSmokeDetector: z.boolean().default(false),
  resetHeatDetector: z.boolean().default(false),
  resetSprinklerHead: z.boolean().default(false),
  resetFirePanel: z.boolean().default(false),
  resetMagLocks: z.boolean().default(false),
  resetElevators: z.boolean().default(false),
  // Main description
  fireLogDetails: z.string().min(1, 'Fire log details are required').max(5000),
  // Email copy recipients (comma-separated)
  sendCopyEmails: z.string().optional(),
});

type FireLogInput = z.infer<typeof fireLogSchema>;

interface Unit {
  id: string;
  number: string;
}

interface CreateFireLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

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
    <label className="flex cursor-pointer items-center gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-neutral-300 accent-blue-600"
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
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: unitsData } = useApi<{ data: Unit[] }>(
    open ? apiUrl('/api/v1/units', { propertyId, pageSize: '500' }) : null,
  );
  const units = unitsData?.data ?? [];

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
      title: '',
      unitId: '',
      alarmTime: new Date().toISOString().slice(0, 16),
      alarmLocation: '',
      alarmType: 'smoke',
      fdCallTime: new Date().toISOString().slice(0, 16),
      announcementTime1: '',
      announcementTime2: '',
      announcementTime3: '',
      fdArrivalTime: '',
      allClearTime: '',
      fdDepartureTime: '',
      fireSafetyPlan: false,
      fireDeptKeys: false,
      residentsNeedingAssistance: false,
      elevator1: false,
      elevator2: false,
      elevator3: false,
      elevator4: false,
      resetPullStation: false,
      resetSmokeDetector: false,
      resetHeatDetector: false,
      resetSprinklerHead: false,
      resetFirePanel: false,
      resetMagLocks: false,
      resetElevators: false,
      fireLogDetails: 'Full Report to Follow...',
      sendCopyEmails: '',
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const combined = [...attachedFiles, ...files].slice(0, 4);
    setAttachedFiles(combined);
    // Reset the input so the same file can be re-added after removal
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeFile(index: number) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadFiles(): Promise<string[]> {
    const urls: string[] = [];
    for (const file of attachedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'fire-logs');
      const res = await fetch('/api/v1/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.url) urls.push(json.data.url);
      }
    }
    return urls;
  }

  async function onSubmit(data: FireLogInput) {
    setServerError(null);
    try {
      // Upload attachments first (if any)
      const attachmentUrls = attachedFiles.length > 0 ? await uploadFiles() : [];

      // Parse comma-separated emails into array
      const emailList = data.sendCopyEmails
        ? data.sendCopyEmails
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean)
        : [];

      const payload = {
        propertyId,
        unitId: data.unitId || null,
        title: data.title,
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
          fireSafetyPlan: data.fireSafetyPlan ?? false,
          fireDeptKeys: data.fireDeptKeys ?? false,
          residentsNeedingAssistance: data.residentsNeedingAssistance ?? false,
        },
        ensureElevatorsReset: {
          elevator1: data.elevator1 ?? false,
          elevator2: data.elevator2 ?? false,
          elevator3: data.elevator3 ?? false,
          elevator4: data.elevator4 ?? false,
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
        fireLogDetails: data.fireLogDetails,
        sendCopyEmails: emailList,
        attachmentUrls,
        additionalNotes: null,
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
      setAttachedFiles([]);
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
  const sectionCls = 'border-neutral-200 rounded-xl border p-4 bg-neutral-50';

  const prepareFields: { field: keyof FireLogInput; label: string }[] = [
    { field: 'fireSafetyPlan', label: 'Fire Safety Plan' },
    { field: 'fireDeptKeys', label: 'Fire department keys' },
    { field: 'residentsNeedingAssistance', label: 'List of residents that need fire assistance' },
  ];

  const elevatorFields: { field: keyof FireLogInput; label: string }[] = [
    { field: 'elevator1', label: 'Elevator 1 (If available)' },
    { field: 'elevator2', label: 'Elevator 2 (If available)' },
    { field: 'elevator3', label: 'Elevator 3 (If available)' },
    { field: 'elevator4', label: 'Elevator 4 (If available)' },
  ];

  const resetFields: { field: keyof FireLogInput; label: string }[] = [
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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
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

          {/* Log Title + Related Unit */}
          <div className={sectionCls}>
            <h3 className="mb-3 text-[14px] font-semibold text-neutral-900">Log Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">
                  Log Title<span className="text-error-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Fire Alarm — 3rd Floor Smoke Detector"
                  {...register('title')}
                  className={inputCls}
                />
                {errors.title && (
                  <span className="text-error-600 text-[12px]">{errors.title.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">Related Unit</label>
                <select {...register('unitId')} className={inputCls}>
                  <option value="">— No unit —</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      Unit {u.number}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Alarm Details */}
          <div className={sectionCls}>
            <h3 className="mb-3 text-[14px] font-semibold text-neutral-900">Alarm Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">
                  Alarm Time<span className="text-error-500 ml-0.5">*</span>
                </label>
                <input type="datetime-local" {...register('alarmTime')} className={inputCls} />
                {errors.alarmTime && (
                  <span className="text-error-600 text-[12px]">{errors.alarmTime.message}</span>
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
                  <span className="text-error-600 text-[12px]">{errors.alarmLocation.message}</span>
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

          {/* Prepare for FD Arrival checklist */}
          <div className={sectionCls}>
            <h3 className="mb-3 text-[14px] font-semibold text-neutral-900">
              Prepare for Fire Department Arrival
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

          {/* Ensure elevators respond */}
          <div className={sectionCls}>
            <h3 className="mb-3 text-[14px] font-semibold text-neutral-900">
              Ensure Elevators Respond
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {elevatorFields.map(({ field, label }) => (
                <NativeCheckbox
                  key={field}
                  checked={!!watch(field)}
                  onChange={(val) => setValue(field, val as any, { shouldValidate: true })}
                  label={label}
                />
              ))}
            </div>
          </div>

          {/* FD Response Timeline */}
          <div className={sectionCls}>
            <h3 className="mb-3 text-[14px] font-semibold text-neutral-900">
              FD Response Timeline
            </h3>
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

          {/* Announcements */}
          <div className={sectionCls}>
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

          {/* Reset Electronic Devices */}
          <div className={sectionCls}>
            <h3 className="mb-3 text-[14px] font-semibold text-neutral-900">
              Reset Electronic Devices
            </h3>
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

          {/* Fire Log Details */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Fire Log Details<span className="text-error-500 ml-0.5">*</span>
            </label>
            <textarea
              {...register('fireLogDetails')}
              className="focus:border-primary-500 focus:ring-primary-100 min-h-[120px] w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none"
            />
            {errors.fireLogDetails && (
              <span className="text-error-600 text-[12px]">{errors.fireLogDetails.message}</span>
            )}
          </div>

          {/* Send Copy */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Send Copy To</label>
            <input
              type="text"
              placeholder="email1@example.com, email2@example.com"
              {...register('sendCopyEmails')}
              className={inputCls}
            />
            <span className="text-[12px] text-neutral-500">
              Separate multiple emails with commas
            </span>
          </div>

          {/* File Attachments */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Attach Files <span className="font-normal text-neutral-500">(max 4 files)</span>
            </label>
            <div className="flex flex-col gap-2">
              {attachedFiles.map((file, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2"
                >
                  <Paperclip className="h-4 w-4 shrink-0 text-neutral-400" />
                  <span className="flex-1 truncate text-[13px] text-neutral-700">{file.name}</span>
                  <span className="shrink-0 text-[12px] text-neutral-400">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {attachedFiles.length < 4 && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-3 text-[14px] text-neutral-500 transition-colors hover:border-neutral-400 hover:text-neutral-700"
                  >
                    <Paperclip className="h-4 w-4" />
                    {attachedFiles.length === 0 ? 'Attach files' : 'Attach another file'}
                  </button>
                </>
              )}
            </div>
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
