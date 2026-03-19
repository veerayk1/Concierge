import { z } from 'zod';
import { isValidCronExpression } from '@/server/scheduling';

/**
 * Recurring Task schemas — Preventive Maintenance Scheduler
 *
 * Supports daily, weekly, biweekly, monthly, quarterly, semiannually,
 * annually, and custom (cron expression) schedules.
 */

export const INTERVAL_TYPES = [
  'daily',
  'weekly',
  'biweekly',
  'monthly',
  'quarterly',
  'semiannually',
  'annually',
  'custom',
] as const;

export type IntervalType = (typeof INTERVAL_TYPES)[number];

export const TASK_STATUSES = ['active', 'paused'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const createRecurringTaskSchema = z
  .object({
    propertyId: z.string().uuid(),
    name: z.string().min(1, 'Task name is required').max(200),
    description: z.string().max(2000).optional().or(z.literal('')),
    categoryId: z.string().uuid('Select a maintenance category'),
    unitId: z.string().uuid().optional().nullable(),
    areaDescription: z.string().max(200).optional().or(z.literal('')),
    location: z.string().max(200).optional().or(z.literal('')),
    notes: z.string().max(4000).optional().or(z.literal('')),
    assignedEmployeeId: z.string().uuid().optional().nullable(),
    assignedVendorId: z.string().uuid().optional().nullable(),
    equipmentId: z.string().uuid().optional().nullable(),
    intervalType: z.enum(INTERVAL_TYPES),
    cronExpression: z.string().max(100).optional().or(z.literal('')),
    customIntervalDays: z.number().int().min(1).max(365).optional().nullable(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional().nullable(),
    autoCreateRequest: z.boolean().default(true),
    defaultPriority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
  })
  .refine(
    (data) => {
      if (data.intervalType === 'custom') {
        // Must have either cronExpression or customIntervalDays
        const hasCron = data.cronExpression && data.cronExpression.length > 0;
        const hasDays = data.customIntervalDays && data.customIntervalDays > 0;
        return hasCron || hasDays;
      }
      return true;
    },
    {
      message: 'Custom interval requires either a cron expression or customIntervalDays',
      path: ['intervalType'],
    },
  )
  .refine(
    (data) => {
      if (data.intervalType === 'custom' && data.cronExpression && data.cronExpression.length > 0) {
        return isValidCronExpression(data.cronExpression);
      }
      return true;
    },
    {
      message:
        'Invalid cron expression format. Expected: minute hour day-of-month month day-of-week',
      path: ['cronExpression'],
    },
  );

export type CreateRecurringTaskInput = z.infer<typeof createRecurringTaskSchema>;

export const updateRecurringTaskSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  categoryId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional().nullable(),
  areaDescription: z.string().max(200).optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
  assignedEmployeeId: z.string().uuid().optional().nullable(),
  assignedVendorId: z.string().uuid().optional().nullable(),
  equipmentId: z.string().uuid().optional().nullable(),
  intervalType: z.enum(INTERVAL_TYPES).optional(),
  cronExpression: z.string().max(100).optional().nullable(),
  customIntervalDays: z.number().int().min(1).max(365).optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  autoCreateRequest: z.boolean().optional(),
  defaultPriority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateRecurringTaskInput = z.infer<typeof updateRecurringTaskSchema>;

export const completeRecurringTaskSchema = z.object({
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export type CompleteRecurringTaskInput = z.infer<typeof completeRecurringTaskSchema>;
