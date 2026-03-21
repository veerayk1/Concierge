'use client';

/**
 * Create Directory Entry Dialog — per Building Directory module
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const directoryEntrySchema = z.object({
  name: z.string().min(2, 'Name is required').max(200),
  category: z.string().min(1, 'Select a category'),
  phone: z.string().min(7, 'Phone number is required').max(20),
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  location: z.string().max(200).optional(),
  hours: z.string().max(100).optional(),
  contactPerson: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

type DirectoryEntryInput = z.infer<typeof directoryEntrySchema>;

const CATEGORIES = [
  { value: 'management', label: 'Management' },
  { value: 'security', label: 'Security' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'amenity', label: 'Amenity' },
  { value: 'emergency', label: 'Emergency' },
  { value: 'utility', label: 'Utility' },
  { value: 'common_area', label: 'Common Area' },
];

interface CreateDirectoryEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateDirectoryEntryDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateDirectoryEntryDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DirectoryEntryInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(directoryEntrySchema) as any,
    defaultValues: {
      name: '',
      category: '',
      phone: '',
      email: '',
      location: '',
      hours: '',
      contactPerson: '',
      notes: '',
    },
  });

  async function onSubmit(data: DirectoryEntryInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/building-directory', {
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
        body: JSON.stringify({ ...data, propertyId }),
      });

      if (!response.ok) {
        const result = await response.json();
        setServerError(result.message || 'Failed to add directory entry');
        return;
      }

      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setServerError('An unexpected error occurred.');
    }
  }

  const selectClass =
    'focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none';
  const selectErrorClass =
    'focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-error-300 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none';
  const textareaBase =
    'w-full rounded-xl border bg-white px-4 py-3 text-[15px] leading-relaxed text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none';
  const textareaDefault =
    'focus:border-primary-500 focus:ring-primary-100 border-neutral-200 hover:border-neutral-300';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Building className="text-primary-500 h-5 w-5" />
          Add Directory Entry
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Add a new contact or service to the building directory.
        </DialogDescription>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-5" noValidate>
          {serverError && (
            <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('name')}
              label="Name"
              placeholder="e.g. Security Desk"
              required
              error={errors.name?.message}
            />

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Category<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('category')}
                className={errors.category ? selectErrorClass : selectClass}
              >
                <option value="">Select category...</option>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('phone')}
              label="Phone"
              placeholder="(416) 555-0100"
              required
              error={errors.phone?.message}
            />
            <Input
              {...register('email')}
              type="email"
              label="Email"
              placeholder="contact@building.ca"
              error={errors.email?.message}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              {...register('location')}
              label="Location"
              placeholder="e.g. Main Lobby"
              error={errors.location?.message}
            />
            <Input
              {...register('hours')}
              label="Hours"
              placeholder="e.g. Mon-Fri 9 AM - 5 PM"
              error={errors.hours?.message}
            />
          </div>

          <Input
            {...register('contactPerson')}
            label="Contact Person"
            placeholder="Full name"
            error={errors.contactPerson?.message}
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Notes</label>
            <textarea
              {...register('notes')}
              placeholder="Additional details about this service..."
              rows={3}
              className={`${textareaBase} ${textareaDefault}`}
              maxLength={2000}
            />
          </div>

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
              {isSubmitting ? 'Adding...' : 'Add Entry'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
