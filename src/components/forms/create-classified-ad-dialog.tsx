'use client';

/**
 * Post Classified Ad Dialog — per PRD 12 Community
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShoppingBag } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const adSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  category: z.string().min(1, 'Select a category'),
  price: z.number().min(0).optional(),
  isFree: z.boolean().default(false),
  contactMethod: z.enum(['message', 'phone', 'email']).default('message'),
});

type AdInput = z.infer<typeof adSchema>;

const CATEGORIES = [
  'Furniture',
  'Electronics',
  'Clothing',
  'Books',
  'Sports & Fitness',
  'Free Stuff',
  'Services',
  'Wanted',
  'Carpool',
  'Pet Supplies',
  'Other',
];

interface CreateClassifiedAdDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateClassifiedAdDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateClassifiedAdDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(adSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      category: '',
      price: undefined,
      isFree: false,
      contactMethod: 'message',
    },
  });

  const isFree = watch('isFree');

  async function onSubmit(data: AdInput) {
    setServerError(null);
    // TODO: Wire to API
    reset();
    onOpenChange(false);
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <ShoppingBag className="text-primary-500 h-5 w-5" />
          Post Classified Ad
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          List an item for sale, offer a service, or post a wanted ad.
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
            placeholder="e.g. IKEA KALLAX Shelf — White"
            required
            error={errors.title?.message}
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Category<span className="text-error-500 ml-0.5">*</span>
            </label>
            <select
              {...register('category')}
              className={`focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none ${
                errors.category ? 'border-error-300' : 'border-neutral-200 hover:border-neutral-300'
              }`}
            >
              <option value="">Select category...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-error-600 text-[13px] font-medium">{errors.category.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">
              Description<span className="text-error-500 ml-0.5">*</span>
            </label>
            <textarea
              {...register('description')}
              placeholder="Describe your item or service..."
              rows={4}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-[15px] leading-relaxed text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none ${
                errors.description
                  ? 'border-error-300 focus:border-error-500 focus:ring-error-100'
                  : 'focus:border-primary-500 focus:ring-primary-100 border-neutral-200 hover:border-neutral-300'
              }`}
              maxLength={2000}
            />
            {errors.description && (
              <p className="text-error-600 text-[13px] font-medium">{errors.description.message}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <Checkbox
              checked={isFree}
              onCheckedChange={(c) => setValue('isFree', c === true)}
              label="This item is free"
              id="is-free"
            />
            {!isFree && (
              <Input
                {...register('price', { valueAsNumber: true })}
                type="number"
                label="Price ($)"
                placeholder="0"
                min={0}
                className="w-32"
                error={errors.price?.message}
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Preferred Contact</label>
            <select
              {...register('contactMethod')}
              className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none"
            >
              <option value="message">In-App Message</option>
              <option value="phone">Phone Call</option>
              <option value="email">Email</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-neutral-100 pt-5">
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
              {isSubmitting ? 'Posting...' : 'Post Ad'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
