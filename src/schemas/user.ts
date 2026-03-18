import { z } from 'zod';

/**
 * Create User schema — per PRD 08 Section 3.1.1
 * 13 fields: firstName, lastName, email, phone, propertyId, roleId, unitId,
 * dateOfBirth, companyName, requireAssistance, frontDeskInstructions,
 * sendWelcomeEmail, languagePreference
 */
export const createUserSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name cannot exceed 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'First name contains invalid characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name cannot exceed 50 characters')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Last name contains invalid characters'),
  email: z.string().min(1, 'Email is required').max(254).email('Valid email address is required'),
  phone: z
    .string()
    .max(20)
    .regex(/^[+\d\s()-]*$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  propertyId: z.string().uuid('Select a property'),
  roleId: z.string().uuid('Select a role'),
  unitId: z.string().uuid('Unit is required for resident accounts').optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  companyName: z
    .string()
    .max(100, 'Company name cannot exceed 100 characters')
    .optional()
    .or(z.literal('')),
  requireAssistance: z.boolean().default(false),
  frontDeskInstructions: z
    .string()
    .max(500, 'Instructions cannot exceed 500 characters')
    .optional()
    .or(z.literal('')),
  sendWelcomeEmail: z.boolean().default(true),
  languagePreference: z.enum(['en', 'fr']).default('en'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

/**
 * Update User schema — subset of create fields that can be edited
 */
export const updateUserSchema = z.object({
  firstName: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .optional(),
  lastName: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .optional(),
  phone: z.string().max(20).optional().or(z.literal('')),
  roleId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  companyName: z.string().max(100).optional().or(z.literal('')),
  requireAssistance: z.boolean().optional(),
  frontDeskInstructions: z.string().max(500).optional().or(z.literal('')),
  languagePreference: z.enum(['en', 'fr']).optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

/**
 * Change user status — per PRD 08 Section 3.1.2
 */
export const changeStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'deactivated']),
  reason: z.string().max(500).optional(),
});

export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;
