/**
 * Amenity Icon Map — Shared utility for mapping amenity names to lucide-react icons.
 * Extracted from amenities/page.tsx so both List and Calendar views can use it.
 */

import {
  Bed,
  Calendar,
  Dumbbell,
  Flame,
  PartyPopper,
  Presentation,
  Tv,
  Users,
  Waves,
} from 'lucide-react';

/** Get a lucide-react icon element for an amenity based on its name */
export function getAmenityIcon(name: string, className = 'h-5 w-5') {
  const lower = name.toLowerCase();
  if (lower.includes('pool') || lower.includes('swim')) return <Waves className={className} />;
  if (lower.includes('gym') || lower.includes('fitness')) return <Dumbbell className={className} />;
  if (lower.includes('theatre') || lower.includes('theater') || lower.includes('media'))
    return <Tv className={className} />;
  if (lower.includes('party') || lower.includes('lounge') || lower.includes('social'))
    return <PartyPopper className={className} />;
  if (lower.includes('bbq') || lower.includes('grill') || lower.includes('rooftop'))
    return <Flame className={className} />;
  if (lower.includes('guest') || lower.includes('suite')) return <Bed className={className} />;
  if (lower.includes('meeting') || lower.includes('board') || lower.includes('conference'))
    return <Presentation className={className} />;
  if (lower.includes('court') || lower.includes('tennis') || lower.includes('sport'))
    return <Users className={className} />;
  return <Calendar className={className} />;
}
