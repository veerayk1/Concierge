import { redirect } from 'next/navigation';

/**
 * Legacy /bookings URL redirect.
 *
 * The booking module lives at /amenities (the calendar grid) and
 * /amenity-booking (the standalone reservation flow). A real user
 * who bookmarked or shared an older /bookings URL was hitting a 404
 * with no path forward. Per docs/QUALITY-BAR.md Section C7
 * (state-of-the-world should never just dead-end), 308-redirect to
 * the canonical page.
 *
 * Tracked as UX-026 in the human-mode QA loop.
 */
export default function BookingsRedirect() {
  redirect('/amenities');
}
