'use client';

/**
 * Create Survey Dialog — per PRD Survey Module
 */

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { z } from 'zod';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const questionSchema = z.object({
  text: z.string().min(1, 'Question text is required').max(500),
  type: z.enum(['multiple_choice', 'text', 'rating', 'yes_no']),
  required: z.boolean().default(false),
});

const surveySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['poll', 'survey', 'feedback']),
  anonymous: z.boolean().default(false),
  closesAt: z.string().optional(),
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
});

type SurveyInput = z.infer<typeof surveySchema>;

const SURVEY_TYPES = [
  { value: 'poll', label: 'Poll' },
  { value: 'survey', label: 'Survey' },
  { value: 'feedback', label: 'Feedback' },
];

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'text', label: 'Text' },
  { value: 'rating', label: 'Rating' },
  { value: 'yes_no', label: 'Yes / No' },
];

interface CreateSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  onSuccess?: () => void;
}

export function CreateSurveyDialog({
  open,
  onOpenChange,
  propertyId,
  onSuccess,
}: CreateSurveyDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SurveyInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(surveySchema) as any,
    defaultValues: {
      title: '',
      description: '',
      type: 'survey',
      anonymous: false,
      closesAt: '',
      questions: [{ text: '', type: 'multiple_choice', required: false }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'questions',
  });

  const anonymous = watch('anonymous');

  const selectClass =
    'focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 hover:border-neutral-300 focus:ring-4 focus:outline-none';
  const selectErrorClass =
    'focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-error-300 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none';
  const textareaBase =
    'w-full rounded-xl border bg-white px-4 py-3 text-[15px] leading-relaxed text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none';
  const textareaDefault =
    'focus:border-primary-500 focus:ring-primary-100 border-neutral-200 hover:border-neutral-300';

  async function onSubmit(data: SurveyInput) {
    setServerError(null);
    try {
      const response = await fetch('/api/v1/surveys', {
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
        setServerError(result.message || 'Failed to create survey');
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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
          <ClipboardList className="text-primary-500 h-5 w-5" />
          New Survey
        </DialogTitle>
        <DialogDescription className="text-[14px] text-neutral-500">
          Create a survey, poll, or feedback form for residents.
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
            placeholder="e.g. Amenity Satisfaction Survey 2026"
            required
            error={errors.title?.message}
          />

          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium text-neutral-700">Description</label>
            <textarea
              {...register('description')}
              placeholder="Describe the purpose of this survey..."
              rows={3}
              className={`${textareaBase} ${textareaDefault}`}
              maxLength={2000}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                Type<span className="text-error-500 ml-0.5">*</span>
              </label>
              <select
                {...register('type')}
                className={errors.type ? selectErrorClass : selectClass}
              >
                {SURVEY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="text-error-600 text-[13px] font-medium">{errors.type.message}</p>
              )}
            </div>

            <Input
              {...register('closesAt')}
              type="date"
              label="Closes At"
              error={errors.closesAt?.message}
            />
          </div>

          <Checkbox
            checked={anonymous}
            onCheckedChange={(c) => setValue('anonymous', c === true)}
            label="Anonymous"
            description="Responses will not be linked to individual residents"
            id="survey-anonymous"
          />

          {/* Questions */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-[14px] font-medium text-neutral-700">
                Questions<span className="text-error-500 ml-0.5">*</span>
              </label>
              <button
                type="button"
                onClick={() => append({ text: '', type: 'multiple_choice', required: false })}
                className="text-primary-600 hover:text-primary-700 flex items-center gap-1 text-[13px] font-semibold transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Question
              </button>
            </div>

            {errors.questions?.root && (
              <p className="text-error-600 text-[13px] font-medium">
                {errors.questions.root.message}
              </p>
            )}

            {fields.map((field, index) => {
              const questionErrors = errors.questions?.[index];
              return (
                <div
                  key={field.id}
                  className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-neutral-500">
                      Question {index + 1}
                    </span>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-error-500 hover:text-error-700 transition-colors"
                        title="Remove question"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <Input
                      {...register(`questions.${index}.text`)}
                      label="Question Text"
                      placeholder="Enter your question..."
                      required
                      error={questionErrors?.text?.message}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-2">
                        <label className="text-[14px] font-medium text-neutral-700">
                          Answer Type
                        </label>
                        <select {...register(`questions.${index}.type`)} className={selectClass}>
                          {QUESTION_TYPES.map((qt) => (
                            <option key={qt.value} value={qt.value}>
                              {qt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-end pb-1">
                        <Checkbox
                          checked={watch(`questions.${index}.required`)}
                          onCheckedChange={(c) =>
                            setValue(`questions.${index}.required`, c === true)
                          }
                          label="Required"
                          id={`question-${index}-required`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

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
              {isSubmitting ? 'Creating...' : 'Create Survey'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
