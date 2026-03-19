'use client';

/**
 * Create Classified Ad Dialog — per PRD Classified Ads / Marketplace
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Store } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const classifiedSchema = z.object({
  title: z.string().min(2, 'Title is required').max(200),
  description: z.string().min(2, 'Description is required').max(5000),
  price: z.coerce.number().min(0, 'Price must be 0 or more'),
  category: z.string().min(1, 'Select a category'),
  condition: z.string().min(1, 'Select a condition'),
});

type ClassifiedInput = z.infer<typeof classifiedSchema>;

const CATEGORIES = [
  { value: 'furniture', label: 'Furniture' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'services', label: 'Services' },
  { value: 'free_stuff', label: 'Free Stuff' },
  { value: 'wanted', label: 'Wanted' },
  { value: 'other', label: 'Other' },
];

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

interface CreateClassifiedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateClassifiedDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateClassifiedDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClassifiedInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(classifiedSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      category: '',
      condition: '',
    },
  });

  async function onSubmit(data: ClassifiedInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/classifieds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('demo_role')
            ? { 'x-demo-role': localStorage.getItem('demo_role')! }
            : {}),
        },
        body: JSON.stringify({ ...data, propertyId }),
      });

      if (!response.ok) {
        const result = await response.json();
        setServerError(result.message || 'Failed to post listing');
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
  const textareaError = 'focus:border-primary-500 focus:ring-primary-100 border-error-300';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <Store className="text-primary-500 h-5 w-5" />
          Post a Listing
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Create a classified ad for your neighbours to see.
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
            placeholder="What are you selling or looking for?"
            required
            error={errors.title?.message}
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Description<span className="text-error-500 ml-0.5">*</span>
            </label>
            <textarea
              {...register('description')}
              placeholder="Describe the item or service in detail..."
              rows={4}
              className={`${textareaBase} ${errors.description ? textareaError : textareaDefault}`}
              maxLength={5000}
            />
            {errors.description && (
              <p className="text-error-600 text-[13px] font-medium">{errors.description.message}</p>
            )}
          </div>

          <Input
            {...register('price', { valueAsNumber: true })}
            type="number"
            label="Price"
            placeholder="0 for free"
            required
            error={errors.price?.message}
          />

          <div className="grid grid-cols-2 gap-4">
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

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Condition<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('condition')}
                className={errors.condition ? selectErrorClass : selectClass}
              >
                <option value="">Select condition...</option>
                {CONDITIONS.map((cond) => (
                  <option key={cond.value} value={cond.value}>
                    {cond.label}
                  </option>
                ))}
              </select>
              {errors.condition && (
                <p className="text-error-600 text-[13px] font-medium">{errors.condition.message}</p>
              )}
            </div>
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
              {isSubmitting ? 'Posting...' : 'Post Listing'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
