'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { CreateBookingDialog } from '@/components/forms/create-booking-dialog';
import {
  Calendar,
  Clock,
  Dumbbell,
  Grid3X3,
  List,
  MapPin,
  Plus,
  Search,
  Tv,
  Users,
  Waves,
  X,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Amenity {
  id: string;
  name: string;
  category: string;
  icon: string;
  location: string;
  capacity: number;
  requiresApproval: boolean;
  availableNow: boolean;
  nextAvailable?: string;
  bookingsToday: number;
  fee?: number;
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_AMENITIES: Amenity[] = [
  {
    id: '1',
    name: 'Rooftop Pool',
    category: 'Recreation',
    icon: 'pool',
    location: 'Floor 25, Rooftop',
    capacity: 30,
    requiresApproval: false,
    availableNow: true,
    bookingsToday: 4,
    fee: 0,
  },
  {
    id: '2',
    name: 'Fitness Center',
    category: 'Recreation',
    icon: 'gym',
    location: 'Floor 2',
    capacity: 20,
    requiresApproval: false,
    availableNow: true,
    bookingsToday: 8,
  },
  {
    id: '3',
    name: 'Party Room',
    category: 'Events',
    icon: 'party',
    location: 'Floor 1, Lobby Level',
    capacity: 50,
    requiresApproval: true,
    availableNow: false,
    nextAvailable: '2026-03-20',
    bookingsToday: 1,
    fee: 200,
  },
  {
    id: '4',
    name: 'Theatre Room',
    category: 'Entertainment',
    icon: 'theatre',
    location: 'Floor 2',
    capacity: 12,
    requiresApproval: false,
    availableNow: true,
    bookingsToday: 0,
  },
  {
    id: '5',
    name: 'Guest Suite',
    category: 'Accommodation',
    icon: 'guest',
    location: 'Floor 3, Suite 301',
    capacity: 2,
    requiresApproval: true,
    availableNow: false,
    nextAvailable: '2026-03-22',
    bookingsToday: 1,
    fee: 75,
  },
  {
    id: '6',
    name: 'BBQ Terrace',
    category: 'Outdoor',
    icon: 'bbq',
    location: 'Floor 25, West Side',
    capacity: 15,
    requiresApproval: false,
    availableNow: true,
    bookingsToday: 2,
  },
  {
    id: '7',
    name: 'Yoga Studio',
    category: 'Recreation',
    icon: 'yoga',
    location: 'Floor 2',
    capacity: 10,
    requiresApproval: false,
    availableNow: true,
    bookingsToday: 3,
  },
  {
    id: '8',
    name: 'Business Center',
    category: 'Work',
    icon: 'business',
    location: 'Floor 1',
    capacity: 8,
    requiresApproval: false,
    availableNow: true,
    bookingsToday: 1,
  },
];

function getAmenityIcon(icon: string) {
  switch (icon) {
    case 'pool':
      return <Waves className="h-5 w-5" />;
    case 'gym':
      return <Dumbbell className="h-5 w-5" />;
    case 'theatre':
      return <Tv className="h-5 w-5" />;
    default:
      return <Calendar className="h-5 w-5" />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AmenitiesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookingDialog, setShowBookingDialog] = useState(false);

  const { data: apiAmenities, refetch } = useApi<Amenity[]>(
    apiUrl('/api/v1/amenities', { propertyId: DEMO_PROPERTY_ID }),
  );

  const allAmenities = useMemo<Amenity[]>(() => apiAmenities ?? MOCK_AMENITIES, [apiAmenities]);

  const filteredAmenities = allAmenities.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return a.name.toLowerCase().includes(q) || a.category.toLowerCase().includes(q);
  });

  return (
    <PageShell
      title="Amenity Booking"
      description="Browse and reserve building amenities."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Calendar className="h-4 w-4" />
            Calendar View
          </Button>
          <Button size="sm" onClick={() => setShowBookingDialog(true)}>
            <Plus className="h-4 w-4" />
            New Booking
          </Button>
        </div>
      }
    >
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search amenities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="focus:border-primary-300 focus:ring-primary-100 h-10 w-full rounded-xl border border-neutral-200 bg-white pr-4 pl-10 text-[14px] text-neutral-900 transition-all duration-200 placeholder:text-neutral-400 focus:ring-4 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredAmenities.map((amenity) => (
          <Card
            key={amenity.id}
            hoverable
            className="cursor-pointer"
            onClick={() => router.push(`/amenities/${amenity.id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="bg-primary-50 text-primary-600 flex h-10 w-10 items-center justify-center rounded-xl">
                {getAmenityIcon(amenity.icon)}
              </div>
              <Badge variant={amenity.availableNow ? 'success' : 'default'} size="sm" dot>
                {amenity.availableNow ? 'Available' : 'Booked'}
              </Badge>
            </div>
            <div className="mt-4">
              <h3 className="text-[16px] font-semibold text-neutral-900">{amenity.name}</h3>
              <p className="mt-0.5 text-[13px] text-neutral-500">{amenity.category}</p>
            </div>
            <div className="mt-4 flex flex-col gap-2 text-[13px] text-neutral-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-neutral-400" />
                {amenity.location}
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-neutral-400" />
                Capacity: {amenity.capacity}
              </span>
              {amenity.bookingsToday > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-neutral-400" />
                  {amenity.bookingsToday} bookings today
                </span>
              )}
            </div>
            <div className="mt-4 flex items-center gap-2">
              {amenity.requiresApproval && (
                <Badge variant="info" size="sm">
                  Requires Approval
                </Badge>
              )}
              {amenity.fee !== undefined && amenity.fee > 0 && (
                <Badge variant="default" size="sm">
                  ${amenity.fee}/booking
                </Badge>
              )}
              {!amenity.availableNow && amenity.nextAvailable && (
                <span className="text-[12px] text-neutral-400">
                  Next:{' '}
                  {new Date(amenity.nextAvailable).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      <CreateBookingDialog
        open={showBookingDialog}
        onOpenChange={setShowBookingDialog}
        propertyId={DEMO_PROPERTY_ID}
        onSuccess={() => {
          setShowBookingDialog(false);
          refetch();
        }}
      />
    </PageShell>
  );
}
