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
export const createReservationSchema = z.object({
  propertyId: z.string().uuid('Must be a valid UUID'),
  amenityId: z.string().uuid('Must be a valid UUID'),
  unitId: z.string().uuid('Must be a valid UUID').optional(),
  startTime: z.string().datetime('Must be a valid ISO 8601 datetime'),
  endTime: z.string().datetime('Must be a valid ISO 8601 datetime'),
  notes: z.string().max(2000, 'Notes must be at most 2000 characters').optional(),
  guestCount: z.number().int().min(1).optional(),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
