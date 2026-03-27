'use client';

/**
 * Create Maintenance Request Dialog — per PRD 05
 */

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wrench, Paperclip, X } from 'lucide-react';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { createMaintenanceSchema, type CreateMaintenanceInput } from '@/schemas/maintenance';
import { usePropertyUnits } from '@/lib/hooks/use-property-units';
import { useApi, apiUrl } from '@/lib/hooks/use-api';

interface ApiCategory {
  id: string;
  name: string;
}

interface CreateMaintenanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateMaintenanceDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateMaintenanceDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { units, loading: unitsLoading } = usePropertyUnits(propertyId);
  const { data: categories } = useApi<ApiCategory[]>(
    apiUrl('/api/v1/maintenance/categories', { propertyId }),
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateMaintenanceInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createMaintenanceSchema) as any,
    defaultValues: {
      propertyId,
      unitId: '',
      categoryId: '',
      description: '',
      priority: 'medium',
      permissionToEnter: false,
      entryInstructions: '',
      contactPhone: '',
    },
  });

  const permissionToEnter = watch('permissionToEnter');
  const selectedPriority = watch('priority');

  async function onSubmit(data: CreateMaintenanceInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('demo_role')
            ? { 'x-demo-role': localStorage.getItem('demo_role')! }
            : {}),
          ...(typeof window !== 'undefined' && localStorage.getItem('auth_token')
            ? { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
            : {}),
        },
        body: JSON.stringify({
          ...data,
          pendingAttachments: attachedFiles.map((f) => f.name),
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setServerError('Your session has expired. Please log in again.');
          if (typeof window !== 'undefined') {
            setTimeout(() => { window.location.href = '/login'; }, 1500);
          }
          return;
        }
        const result = await response.json().catch(() => ({}));
        setServerError(result.message || `Failed to create request (${response.status})`);
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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) {
      setAttachedFiles((prev) => [...prev, ...Array.from(files)]);
    }
    e.target.value = '';
  }

  function removeFile(index: number) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Wrench className="text-primary-500 h-5 w-5" />
          New Maintenance Request
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Submit a new maintenance request for a unit.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Unit<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('unitId')}
                className={`focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none ${
                  errors.unitId ? 'border-error-300' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                <option value="">{unitsLoading ? 'Loading units...' : 'Select unit...'}</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.number}
                  </option>
                ))}
              </select>
              {errors.unitId && (
                <p className="text-error-600 text-[13px] font-medium">{errors.unitId.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Category</label>
              <select
                {...register('categoryId')}
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none"
              >
                <option value="">Select category...</option>
                {(categories ?? []).map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Description<span className="text-error-500 ml-0.5">*</span>
            </label>
            <textarea
              {...register('description')}
              placeholder="Describe the issue in detail (minimum 10 characters)..."
              rows={4}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none ${
                errors.description
                  ? 'border-error-300 focus:border-error-500 focus:ring-error-100'
                  : 'focus:border-primary-500 focus:ring-primary-100 border-neutral-200 hover:border-neutral-300'
              }`}
              maxLength={4000}
            />
            {errors.description && (
              <p className="text-error-600 text-[13px] font-medium">{errors.description.message}</p>
            )}
          </div>

          {/* Attachments */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Photos &amp; Documents
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/heic,image/webp,application/pdf,.doc,.docx,.xlsx"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 px-4 py-3 text-[14px] text-neutral-500 transition-colors hover:border-neutral-300 hover:bg-neutral-100"
            >
              <Paperclip className="h-4 w-4" />
              Attach photos or documents
            </button>

            {attachedFiles.length > 0 && (
              <div className="flex flex-col gap-1">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-[13px] text-neutral-700"
                  >
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="ml-2 flex-shrink-0 text-neutral-400 hover:text-neutral-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <p className="text-[12px] text-neutral-400">
                  Files will be uploaded after submission
                </p>
              </div>
            )}
          </div>

          {/* Priority */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Priority</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high', 'urgent'] as const).map((p) => {
                const colors = {
                  low: 'bg-neutral-100 text-neutral-600',
                  medium: 'bg-warning-50 text-warning-700',
                  high: 'bg-error-50 text-error-700',
                  urgent: 'bg-error-100 text-error-800',
                };
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setValue('priority', p)}
                    className={`flex-1 rounded-xl py-2 text-[13px] font-semibold capitalize transition-all ${
                      selectedPriority === p
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

          {/* Entry Permission */}
          <div className="flex flex-col gap-3">
            <Checkbox
              checked={permissionToEnter}
              onCheckedChange={(c) => setValue('permissionToEnter', c === true)}
              label="Permission to Enter"
              description="Staff can enter the unit without the resident being present"
              id="permission-enter"
            />

            {permissionToEnter && (
              <div className="ml-8">
                <Input
                  {...register('entryInstructions')}
                  label="Entry Instructions"
                  placeholder="e.g. Key at front desk, dog in bedroom"
                  error={errors.entryInstructions?.message}
                />
              </div>
            )}
          </div>

          {/* Contact */}
          <Input
            {...register('contactPhone')}
            label="Contact Phone"
            placeholder="Best number to reach resident"
            error={errors.contactPhone?.message}
          />

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
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
