'use client';

/**
 * Create Maintenance Request Dialog — per PRD 05
 */

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wrench, Paperclip, X, Loader2, ImageIcon, FileText } from 'lucide-react';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { createMaintenanceSchema, type CreateMaintenanceInput } from '@/schemas/maintenance';
import { usePropertyUnits } from '@/lib/hooks/use-property-units';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';

// ---------------------------------------------------------------------------
// File upload helpers
// ---------------------------------------------------------------------------

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB per PRD

interface UploadedFile {
  fileName: string;
  contentType: string;
  fileSizeBytes: number;
  key: string; // Storage key returned by upload API
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(file: File): boolean {
  return file.type.startsWith('image/');
}

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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
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
      hideFromResident: false,
    },
  });

  const permissionToEnter = watch('permissionToEnter');
  const selectedPriority = watch('priority');
  const hideFromResident = watch('hideFromResident');

  // Upload a single file to the storage API and return metadata
  async function uploadFile(file: File): Promise<UploadedFile> {
    // 1. Get presigned URL from our API
    const resp = await apiRequest('/api/v1/upload', {
      method: 'POST',
      body: { module: 'maintenance', fileName: file.name, contentType: file.type },
    });
    const presigned = (await resp.json()) as {
      data: { url: string; key: string; fields?: Record<string, string> };
    };

    // 2. Upload file to presigned URL (or dev mock)
    if (presigned.data.url.startsWith('https://')) {
      // Real S3 presigned POST
      const formData = new FormData();
      if (presigned.data.fields) {
        for (const [k, v] of Object.entries(presigned.data.fields)) {
          formData.append(k, v);
        }
      }
      formData.append('file', file);
      await fetch(presigned.data.url, { method: 'POST', body: formData });
    }
    // In dev mode the URL is a mock — no actual upload needed

    return {
      fileName: file.name,
      contentType: file.type,
      fileSizeBytes: file.size,
      key: presigned.data.key,
    };
  }

  async function onSubmit(data: CreateMaintenanceInput) {
    setServerError(null);
    setUploadError(null);

    try {
      // 1. Upload all attached files first
      let uploaded = uploadedFiles;
      const newFiles = attachedFiles.filter(
        (f) => !uploadedFiles.some((u) => u.fileName === f.name && u.fileSizeBytes === f.size),
      );

      if (newFiles.length > 0) {
        setUploading(true);
        try {
          const results = await Promise.all(newFiles.map(uploadFile));
          uploaded = [...uploadedFiles, ...results];
          setUploadedFiles(uploaded);
        } catch {
          setUploadError('Failed to upload one or more files. Please try again.');
          setUploading(false);
          return;
        }
        setUploading(false);
      }

      // 2. Create the maintenance request with attachment metadata
      const resp = await apiRequest('/api/v1/maintenance', {
        method: 'POST',
        body: {
          ...data,
          attachments: uploaded.map((f) => ({
            fileName: f.fileName,
            contentType: f.contentType,
            fileSizeBytes: f.fileSizeBytes,
            key: f.key,
          })),
        },
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        setServerError((errData as { message?: string }).message || 'Failed to create request.');
        return;
      }

      reset();
      setAttachedFiles([]);
      setUploadedFiles([]);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: unknown) {
      const apiErr = err as { message?: string; status?: number };
      if (apiErr.status === 401) {
        setServerError('Your session has expired. Please log in again.');
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        }
        return;
      }
      setServerError(apiErr.message || 'An unexpected error occurred.');
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const errors: string[] = [];

    for (const f of newFiles) {
      if (f.size > MAX_FILE_SIZE) {
        errors.push(`${f.name} exceeds 4MB limit`);
      }
    }

    if (errors.length > 0) {
      setUploadError(errors.join('. '));
      return;
    }

    setUploadError(null);
    setAttachedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  }

  function removeFile(index: number) {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
    // Also remove from uploaded list if it was already uploaded
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
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

            {uploadError && <p className="text-[13px] font-medium text-red-600">{uploadError}</p>}

            {attachedFiles.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center gap-3 rounded-lg bg-neutral-50 px-3 py-2"
                  >
                    {isImage(file) ? (
                      <ImageIcon className="h-4 w-4 shrink-0 text-blue-500" />
                    ) : (
                      <FileText className="h-4 w-4 shrink-0 text-neutral-400" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-neutral-700">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-neutral-400">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      disabled={isSubmitting || uploading}
                      className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 disabled:opacity-40"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <p className="text-[12px] text-neutral-400">
                  Max 4MB per file. JPG, PNG, GIF, HEIC, PDF, DOC, XLSX accepted.
                </p>
              </div>
            )}

            {uploading && (
              <div className="flex items-center gap-2 text-[13px] text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading files...
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

          {/* Hide from Resident — Staff/Admin only */}
          <Checkbox
            checked={hideFromResident}
            onCheckedChange={(c) => setValue('hideFromResident', c === true)}
            label="Hide from Resident"
            description="Do not show this request in the resident portal"
            id="hide-from-resident"
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
            <Button
              type="submit"
              loading={isSubmitting || uploading}
              disabled={isSubmitting || uploading}
            >
              {uploading ? 'Uploading files...' : isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
