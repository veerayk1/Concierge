/**
 * Concierge — Reservation / Booking Validation Schemas
 *
 * Schemas for amenity booking (reservation) creation and updates.
 * Per PRD 06: Amenity Booking
 *
 * @module schemas/reservation
 */

import { z } from 'zod';

/** Schema for creating a new reservation/booking. */
export const createReservationSchema = z
  .object({
    propertyId: z.string().uuid('Must be a valid UUID'),
    amenityId: z.string().uuid('Must be a valid UUID'),
    unitId: z.string().uuid('Must be a valid UUID').optional(),
    startTime: z.string().datetime('Must be a valid ISO 8601 datetime'),
    endTime: z.string().datetime('Must be a valid ISO 8601 datetime'),
    notes: z.string().max(2000, 'Notes must be at most 2000 characters').optional(),
    guestCount: z.number().int().min(1, 'Guest count must be at least 1').optional(),
    partySize: z.number().int().min(1, 'Party size must be at least 1').optional(),
  })
  .refine((d) => new Date(d.endTime).getTime() > new Date(d.startTime).getTime(), {
    message: 'End time must be after start time',
    path: ['endTime'],
  })
  .refine((d) => new Date(d.startTime).getTime() > Date.now() - 60_000, {
    // Allow a 60s clock-skew window but block obvious "book the past" attempts.
    message: 'Start time must be in the future',
    path: ['startTime'],
  });

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
