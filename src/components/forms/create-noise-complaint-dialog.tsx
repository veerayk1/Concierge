'use client';

/**
 * Noise Complaint Dialog — Complete per docs/logs.md spec
 * Gap 3.2: All missing investigation fields now implemented:
 *   - Title field
 *   - 4 specific investigation dropdowns (per spec question text)
 *   - "Suspect contacted by" as 5-checkbox multi-select
 *   - "Complainant advised of action taken" dropdown
 *   - "Noise log Details" required textarea (pre-filled)
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
  title: z.string().optional(),
  complainantUnit: z.string().min(1, 'Complainant unit is required'),
  suspectUnit: z.string().min(1, 'Suspect unit is required'),
  dateTime: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, 'Invalid date/time'),
  // 14 complaint types
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
  // Investigation — 4 specific dropdowns per spec
  complainantFloorNoticeable: z.string().optional(),
  suspectFloorNoticeable: z.string().optional(),
  noiseDurationAssessment: z.string().optional(),
  noiseDegreeAssessment: z.string().optional(),
  lengthOfTimeVerified: z.string().optional(),
  // Suspect contacted by — 5 checkboxes
  contactHomePhone: z.boolean().default(false),
  contactWorkPhone: z.boolean().default(false),
  contactOtherPhone: z.boolean().default(false),
  contactAtDoor: z.boolean().default(false),
  contactNoOneHome: z.boolean().default(false),
  // Complainant advised
  complainantAdvised: z.string().optional(),
  // Main description
  noiseLogDetails: z.string().min(1, 'Noise log details are required').max(5000),
});

type NoiseComplaintInput = z.infer<typeof noiseComplaintSchema>;

const COMPLAINT_TYPES = [
  { field: 'complaintDropOnFloor', label: 'Drop on Floor' },
  { field: 'complaintLoudMusic', label: 'Loud Music' },
  { field: 'complaintSmokingHallway', label: 'Smoking Hallways' },
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
] as const;

const SUSPECT_CONTACT_FIELDS = [
  { field: 'contactHomePhone', label: 'Home Phone' },
  { field: 'contactWorkPhone', label: 'Work Phone' },
  { field: 'contactOtherPhone', label: 'Other Phone' },
  { field: 'contactAtDoor', label: 'At the door' },
  { field: 'contactNoOneHome', label: 'No one home' },
] as const;

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
      noiseLogDetails: 'Full Report to Follow...',
    },
  });

  async function onSubmit(data: NoiseComplaintInput) {
    setServerError(null);
    try {
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

      const suspectContactedBy: string[] = [];
      if (data.contactHomePhone) suspectContactedBy.push('Home Phone');
      if (data.contactWorkPhone) suspectContactedBy.push('Work Phone');
      if (data.contactOtherPhone) suspectContactedBy.push('Other Phone');
      if (data.contactAtDoor) suspectContactedBy.push('At the door');
      if (data.contactNoOneHome) suspectContactedBy.push('No one home');

      const payload = {
        propertyId,
        title: data.title || null,
        complainantFloor: data.complainantUnit,
        suspectFloor: data.suspectUnit,
        natureOfComplaint,
        complainantFloorNoticeable: data.complainantFloorNoticeable || null,
        suspectFloorNoticeable: data.suspectFloorNoticeable || null,
        noiseDuration: data.lengthOfTimeVerified || null,
        noiseDurationAssessment: data.noiseDurationAssessment || null,
        noiseDegreeAssessment: data.noiseDegreeAssessment || null,
        suspectContactedBy,
        complainantAdvised: data.complainantAdvised || null,
        noiseLogDetails: data.noiseLogDetails,
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

  const inputCls =
    'focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none';
  const sectionCls = 'border-neutral-200 rounded-xl border p-4 bg-neutral-50';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
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
          <div className={sectionCls}>
            <h3 className="mb-3 text-[14px] font-semibold text-neutral-900">Complaint Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">Title</label>
                <input
                  type="text"
                  placeholder="e.g., Noise complaint — Unit 402"
                  {...register('title')}
                  className={inputCls}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">
                  Complainant Unit<span className="text-error-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., 302"
                  {...register('complainantUnit')}
                  className={inputCls}
                />
                {errors.complainantUnit && (
                  <span className="text-error-600 text-[12px]">
                    {errors.complainantUnit.message}
                  </span>
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
                  className={inputCls}
                />
                {errors.suspectUnit && (
                  <span className="text-error-600 text-[12px]">{errors.suspectUnit.message}</span>
                )}
              </div>

              <div className="col-span-2 flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">
                  Date & Time<span className="text-error-500 ml-0.5">*</span>
                </label>
                <input type="datetime-local" {...register('dateTime')} className={inputCls} />
                {errors.dateTime && (
                  <span className="text-error-600 text-[12px]">{errors.dateTime.message}</span>
                )}
              </div>
            </div>
          </div>

          {/* Nature of Complaint — 14 checkboxes */}
          <div className={sectionCls}>
            <h3 className="mb-3 text-[14px] font-semibold text-neutral-900">Nature of Complaint</h3>
            <div className="grid grid-cols-2 gap-3">
              {COMPLAINT_TYPES.map(({ field, label }) => (
                <label key={field} className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!!watch(field as any)}
                    onChange={(e) =>
                      setValue(field as any, e.target.checked, { shouldValidate: true })
                    }
                    className="text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-neutral-300 accent-blue-600"
                  />
                  <span className="text-[14px] text-neutral-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Investigation */}
          <div className={sectionCls}>
            <h3 className="mb-3 text-[14px] font-semibold text-neutral-900">Investigation</h3>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">
                  Upon investigating the complainant's floor, the noise was noticeable by
                </label>
                <select {...register('complainantFloorNoticeable')} className={inputCls}>
                  <option value="">— Select —</option>
                  <option value="Hearing it clearly">Hearing it clearly</option>
                  <option value="Hearing it faintly">Hearing it faintly</option>
                  <option value="Feeling vibrations">Feeling vibrations</option>
                  <option value="Both hearing and vibrations">Both hearing and vibrations</option>
                  <option value="Not noticeable">Not noticeable</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">
                  Upon investigating the suspect's floor, the noise was noticeable
                </label>
                <select {...register('suspectFloorNoticeable')} className={inputCls}>
                  <option value="">— Select —</option>
                  <option value="Yes, clearly">Yes, clearly</option>
                  <option value="Yes, faintly">Yes, faintly</option>
                  <option value="Slightly">Slightly</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-medium text-neutral-700">
                    Upon investigating, the noise duration was
                  </label>
                  <select {...register('noiseDurationAssessment')} className={inputCls}>
                    <option value="">— Select —</option>
                    <option value="Brief (< 5 min)">Brief ({'<'} 5 min)</option>
                    <option value="Short (5-15 min)">Short (5–15 min)</option>
                    <option value="Moderate (15-30 min)">Moderate (15–30 min)</option>
                    <option value="Long (30-60 min)">Long (30–60 min)</option>
                    <option value="Extended (> 60 min)">Extended ({'>'} 60 min)</option>
                    <option value="Ongoing">Ongoing</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-medium text-neutral-700">
                    Upon investigating, the noise degree/volume was
                  </label>
                  <select {...register('noiseDegreeAssessment')} className={inputCls}>
                    <option value="">— Select —</option>
                    <option value="Low">Low</option>
                    <option value="Moderate">Moderate</option>
                    <option value="High">High</option>
                    <option value="Very High / Excessive">Very High / Excessive</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-medium text-neutral-700">
                  Length of time verified
                </label>
                <input
                  type="text"
                  placeholder="e.g., 25 minutes"
                  {...register('lengthOfTimeVerified')}
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Suspect Contacted By — 5 checkboxes */}
          <div className={sectionCls}>
            <h3 className="mb-3 text-[14px] font-semibold text-neutral-900">
              Suspect Contacted By
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {SUSPECT_CONTACT_FIELDS.map(({ field, label }) => (
                <label key={field} className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={!!watch(field as any)}
                    onChange={(e) =>
                      setValue(field as any, e.target.checked, { shouldValidate: true })
                    }
                    className="text-primary-600 focus:ring-primary-500 h-4 w-4 rounded border-neutral-300 accent-blue-600"
                  />
                  <span className="text-[14px] text-neutral-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Complainant Advised */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Complainant contacted to advise of action taken
            </label>
            <select {...register('complainantAdvised')} className={inputCls}>
              <option value="">— Select —</option>
              <option value="Yes - by phone">Yes — by phone</option>
              <option value="Yes - in person">Yes — in person</option>
              <option value="Yes - by note/letter">Yes — by note/letter</option>
              <option value="Unable to reach">Unable to reach</option>
              <option value="Not yet">Not yet</option>
            </select>
          </div>

          {/* Noise Log Details */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Noise Log Details<span className="text-error-500 ml-0.5">*</span>
            </label>
            <textarea
              {...register('noiseLogDetails')}
              className="focus:border-primary-500 focus:ring-primary-100 min-h-[120px] w-full resize-none rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none"
            />
            {errors.noiseLogDetails && (
              <span className="text-error-600 text-[12px]">{errors.noiseLogDetails.message}</span>
            )}
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
