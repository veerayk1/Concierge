'use client';

/**
 * Noise Complaint Dialog — Critical gap feature for security console
 * Track noise complaints with 14 complaint types and investigation details
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Volume2 } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/hooks/use-api';

const noiseComplaintSchema = z.object({
  complainantUnit: z.string().min(1, 'Complainant unit is required'),
  suspectUnit: z.string().min(1, 'Suspect unit is required'),
  floors: z.string().optional(),
  dateTime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, 'Invalid date/time'),
  // Complaint types (14 options)
  complaintDropOnFloor: z.boolean().default(false),
  complaintLoudMusic: z.boolean().default(false),
  complaintSmokingHallway: z.boolean().default(false),
  complaintSmokingSuite: z.boolean().default(false),
  complaintHallwayNoise: z.boolean().default(false),
  complaintPianoPlaying: z.boolean().default(false),
  complaintDogBarking: z.boolean().default(false),
  complaintCookingOdors: z.boolean().default(false),
  complaintChildrenPlaying: z.boolean().default(false),
  complaintWalkingBanging: z.boolean().default(false),
  complaintParty: z.boolean().default(false),
  complaintTalking: z.boolean().default(false),
  complaintConstruction: z.boolean().default(false),
  complaintOther: z.boolean().default(false),
  // Investigation
  noiseNoticeable: z.enum(['yes', 'no', 'unknown']).default('unknown'),
  duration: z.string().optional(),
  volume: z.number().min(1).max(10).optional(),
  contactMethod: z.enum(['phone', 'email', 'in_person', 'letter']).default('phone'),
  counselingNotes: z.string().max(2000).optional(),
});

type NoiseComplaintInput = z.infer<typeof noiseComplaintSchema>;

const COMPLAINT_TYPES = [
  { field: 'complaintDropOnFloor', label: 'Drop on Floor' },
  { field: 'complaintLoudMusic', label: 'Loud Music' },
  { field: 'complaintSmokingHallway', label: 'Smoking in Hallways' },
  { field: 'complaintSmokingSuite', label: 'Smoking in Suite' },
  { field: 'complaintHallwayNoise', label: 'Hallway Noise' },
  { field: 'complaintPianoPlaying', label: 'Piano Playing' },
  { field: 'complaintDogBarking', label: 'Dog Barking' },
  { field: 'complaintCookingOdors', label: 'Cooking Odors' },
  { field: 'complaintChildrenPlaying', label: 'Children Playing' },
  { field: 'complaintWalkingBanging', label: 'Walking/Banging' },
  { field: 'complaintParty', label: 'Party' },
  { field: 'complaintTalking', label: 'Talking' },
  { field: 'complaintConstruction', label: 'Construction' },
  { field: 'complaintOther', label: 'Other' },
];

interface CreateNoiseComplaintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateNoiseComplaintDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateNoiseComplaintDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NoiseComplaintInput>({
    resolver: zodResolver(noiseComplaintSchema) as any,
    defaultValues: {
      dateTime: new Date().toISOString().slice(0, 16),
      noiseNoticeable: 'unknown',
      contactMethod: 'phone',
    },
  });

  const volume = watch('volume');
  const noiseNoticeable = watch('noiseNoticeable');
  const contactMethod = watch('contactMethod');

  async function onSubmit(data: NoiseComplaintInput) {
    setServerError(null);
    try {
      // Transform form booleans into natureOfComplaint array for API
      const natureOfComplaint: string[] = [];
      if (data.complaintDropOnFloor) natureOfComplaint.push('Drop on Floor');
      if (data.complaintLoudMusic) natureOfComplaint.push('Loud Music');
      if (data.complaintSmokingHallway) natureOfComplaint.push('Smoking Hallways');
      if (data.complaintSmokingSuite) natureOfComplaint.push('Smoking in Suite');
      if (data.complaintHallwayNoise) natureOfComplaint.push('Hallway Noise');
      if (data.complaintPianoPlaying) natureOfComplaint.push('Piano Playing');
      if (data.complaintDogBarking) natureOfComplaint.push('Dog Barking');
      if (data.complaintCookingOdors) natureOfComplaint.push('Cooking Odors');
      if (data.complaintChildrenPlaying) natureOfComplaint.push('Children Playing');
      if (data.complaintWalkingBanging) natureOfComplaint.push('Walking/Banging');
      if (data.complaintParty) natureOfComplaint.push('Party');
      if (data.complaintTalking) natureOfComplaint.push('Talking');
      if (data.complaintConstruction) natureOfComplaint.push('Construction');
      if (data.complaintOther) natureOfComplaint.push('Other');

      if (natureOfComplaint.length === 0) {
        setServerError('Please select at least one complaint type.');
        return;
      }

      const payload = {
        propertyId,
        complainantFloor: data.complainantUnit,
        suspectFloor: data.suspectUnit,
        natureOfComplaint,
        noiseDuration: data.duration || null,
        noiseVolume: data.volume || null,
        suspectContactMethod: data.contactMethod,
        counselingNotes: data.counselingNotes || null,
        resolutionStatus: 'pending',
      };

      const response = await apiRequest('/api/v1/security/noise-complaints', {
        method: 'POST',
        body: payload,
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setServerError(result.message || `Failed to create complaint (${response.status})`);
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Volume2 className="text-warning-500 h-5 w-5" />
          Noise Complaint Report
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Document and investigate noise complaints from residents.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          {/* Complaint Details */}
          <div className="border-neutral-200 rounded-xl border p-4 bg-neutral-50">
            <h3 className="mb-3 text-[14px] font-semibold text-neutral-900">Complaint Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">
                  Complainant Unit<span className="text-error-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 302"
                  {...register('complainantUnit')}
                  className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none"
                />
                {errors.complainantUnit && (
                  <span className="text-[12px] text-error-600">{errors.complainantUnit.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">
                  Suspect Unit<span className="text-error-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 402"
                  {...register('suspectUnit')}
                  className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none"
                />
                {errors.suspectUnit && (
                  <span className="text-[12px] text-error-600">{errors.suspectUnit.message}</span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">Floors Involved</label>
                <input
                  type="text"
                  placeholder="e.g., 2nd-3rd floor"
                  {...register('floors')}
                  className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none"
                />
              </div>

              <div className="col-span-2 flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">
                  Date & Time<span className="text-error-500 ml-0.5">*</span>
                </label>
                <input
                  type="datetime-local"
                  {...register('dateTime')}
                  className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none"
                />
                {errors.dateTime && (
                  <span className="text-[12px] text-error-600">{errors.dateTime.message}</span>
                )}
              </div>
            </div>
          </div>

          {/* Complaint Types */}
          <div className="border-neutral-200 rounded-xl border p-4 bg-neutral-50">
            <h3 className="mb-3 text-[14px] font-semibold text-neutral-900">Complaint Type</h3>
            <div className="grid grid-cols-2 gap-3">
              {COMPLAINT_TYPES.map(({ field, label }) => (
                <label key={field} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!watch(field as any)}
                    onChange={(e) => setValue(field as any, e.target.checked, { shouldValidate: true })}
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 accent-blue-600"
                  />
                  <span className="text-[14px] text-neutral-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Investigation */}
          <div className="border-neutral-200 rounded-xl border p-4 bg-neutral-50">
            <h3 className="mb-3 text-[14px] font-semibold text-neutral-900">Investigation</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">Noise Noticeable?</label>
                <select
                  {...register('noiseNoticeable')}
                  className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none"
                >
                  <option value="unknown">Unknown</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">Duration</label>
                <input
                  type="text"
                  placeholder="e.g., 30 minutes, 1 hour"
                  {...register('duration')}
                  className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">
                  Volume Level {volume && `(${volume}/10)`}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  {...register('volume', { valueAsNumber: true })}
                  className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">Contact Method</label>
                <select
                  {...register('contactMethod')}
                  className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none"
                >
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="in_person">In Person</option>
                  <option value="letter">Letter</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Counseling Notes</label>
              <textarea
                {...register('counselingNotes')}
                placeholder="Notes from conversation with resident..."
                className="focus:border-primary-500 focus:ring-primary-100 min-h-[100px] w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none resize-none"
              />
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
              {isSubmitting ? 'Logging...' : 'Log Complaint'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
