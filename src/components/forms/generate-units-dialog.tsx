'use client';

/**
 * Auto-Generate Units Dialog
 * Creates units from floor ranges with preview.
 */

import { useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Wand2 } from 'lucide-react';

const schema = z.object({
  floorStart: z.coerce.number().int().min(0).max(200),
  floorEnd: z.coerce.number().int().min(0).max(200),
  unitsPerFloor: z.coerce.number().int().min(1).max(100),
  numberingPattern: z.enum(['floor_prefix', 'sequential']),
  unitType: z.string().min(1),
});

type FormInput = z.infer<typeof schema>;

interface GenerateUnitsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function GenerateUnitsDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: GenerateUnitsDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormInput>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      floorStart: 1,
      floorEnd: 10,
      unitsPerFloor: 8,
      numberingPattern: 'floor_prefix',
      unitType: 'residential',
    },
  });

  const values = watch();

  // Generate preview
  const preview = useMemo(() => {
    const units: string[] = [];
    let seq = 1;
    for (let floor = values.floorStart; floor <= values.floorEnd; floor++) {
      for (let unit = 1; unit <= values.unitsPerFloor; unit++) {
        if (values.numberingPattern === 'floor_prefix') {
          units.push(`${floor}${String(unit).padStart(2, '0')}`);
        } else {
          units.push(String(seq++));
        }
      }
    }
    return units;
  }, [values.floorStart, values.floorEnd, values.unitsPerFloor, values.numberingPattern]);

  const onSubmit = useCallback(
    async (data: FormInput) => {
      setServerError(null);
      setResult(null);

      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/v1/units/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(localStorage.getItem('demo_role') && {
              'x-demo-role': localStorage.getItem('demo_role')!,
            }),
          },
          body: JSON.stringify({
            propertyId,
            ...data,
            skipExisting: true,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          setServerError(err.message || 'Failed to generate units');
          return;
        }

        const res = await response.json();
        setResult(res.data);
        onSuccess?.();
      } catch {
        setServerError('Network error');
      }
    },
    [propertyId, onSuccess],
  );

  const handleClose = useCallback(() => {
    reset();
    setServerError(null);
    setResult(null);
    onOpenChange(false);
  }, [reset, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Auto-Generate Units</DialogTitle>
        <DialogDescription>Automatically create units for a range of floors.</DialogDescription>

        {result ? (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
              <p className="text-lg font-semibold text-green-800">{result.created} units created</p>
              {result.skipped > 0 && (
                <p className="text-sm text-green-600">{result.skipped} already existed (skipped)</p>
              )}
            </div>
            <Button onClick={handleClose} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  Start Floor
                </label>
                <Input
                  type="number"
                  {...register('floorStart')}
                  error={errors.floorStart?.message}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">End Floor</label>
                <Input type="number" {...register('floorEnd')} error={errors.floorEnd?.message} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Units Per Floor
              </label>
              <Input
                type="number"
                {...register('unitsPerFloor')}
                error={errors.unitsPerFloor?.message}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">
                Numbering Pattern
              </label>
              <select
                {...register('numberingPattern')}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm"
              >
                <option value="floor_prefix">Floor Prefix (101, 102... 201, 202...)</option>
                <option value="sequential">Sequential (1, 2, 3...)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-700">Unit Type</label>
              <select
                {...register('unitType')}
                className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm"
              >
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="studio">Studio</option>
                <option value="1br">1 Bedroom</option>
                <option value="2br">2 Bedroom</option>
                <option value="3br">3 Bedroom</option>
                <option value="penthouse">Penthouse</option>
                <option value="storage">Storage</option>
                <option value="parking">Parking</option>
              </select>
            </div>

            {/* Preview */}
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
              <p className="mb-1 text-xs font-medium text-neutral-600">
                Preview ({preview.length} units)
              </p>
              <p className="text-sm text-neutral-700">
                {preview.slice(0, 8).join(', ')}
                {preview.length > 8 && `, ... ${preview[preview.length - 1]}`}
              </p>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Generate {preview.length} Units
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
