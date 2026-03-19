'use client';

import {
  Calendar,
  Clock,
  DollarSign,
  Dumbbell,
  Flame,
  MapPin,
  Tv,
  Users,
  Waves,
  X,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/ui/data-table';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AmenityOption {
  id: string;
  name: string;
  icon: string;
  available: boolean;
  capacity: number;
  fee: number | null;
}

interface MyBooking {
  id: string;
  amenity: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending_approval';
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const AMENITIES: AmenityOption[] = [
  { id: '1', name: 'Party Room', icon: 'party', available: true, capacity: 50, fee: 200 },
  { id: '2', name: 'BBQ Area', icon: 'bbq', available: true, capacity: 15, fee: null },
  { id: '3', name: 'Guest Suite', icon: 'guest', available: false, capacity: 2, fee: 75 },
  { id: '4', name: 'Gym', icon: 'gym', available: true, capacity: 20, fee: null },
  { id: '5', name: 'Pool', icon: 'pool', available: true, capacity: 30, fee: null },
  { id: '6', name: 'Meeting Room', icon: 'meeting', available: true, capacity: 10, fee: null },
];

const MY_BOOKINGS: MyBooking[] = [
  {
    id: '1',
    amenity: 'Party Room',
    date: '2026-03-22',
    time: '6:00 PM - 10:00 PM',
    status: 'confirmed',
  },
  {
    id: '2',
    amenity: 'BBQ Area',
    date: '2026-03-25',
    time: '12:00 PM - 3:00 PM',
    status: 'pending_approval',
  },
];

// ---------------------------------------------------------------------------
// Icon helper
// ---------------------------------------------------------------------------

function getAmenityIcon(icon: string) {
  switch (icon) {
    case 'pool':
      return <Waves className="h-5 w-5" />;
    case 'gym':
      return <Dumbbell className="h-5 w-5" />;
    case 'bbq':
      return <Flame className="h-5 w-5" />;
    case 'meeting':
      return <Tv className="h-5 w-5" />;
    case 'guest':
      return <MapPin className="h-5 w-5" />;
    default:
      return <Calendar className="h-5 w-5" />;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AmenityBookingPage() {
  const bookingColumns: Column<MyBooking>[] = [
    {
      id: 'amenity',
      header: 'Amenity',
      accessorKey: 'amenity',
      sortable: true,
      cell: (row) => <span className="font-medium text-neutral-900">{row.amenity}</span>,
    },
    {
      id: 'date',
      header: 'Date',
      accessorKey: 'date',
      sortable: true,
      cell: (row) => (
        <span className="text-[13px] text-neutral-600">
          {new Date(row.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      id: 'time',
      header: 'Time',
      accessorKey: 'time',
      cell: (row) => (
        <span className="flex items-center gap-1.5 text-[13px] text-neutral-500">
          <Clock className="h-3.5 w-3.5 text-neutral-400" />
          {row.time}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => {
        if (row.status === 'confirmed') {
          return (
            <Badge variant="success" size="sm" dot>
              Confirmed
            </Badge>
          );
        }
        return (
          <Badge variant="warning" size="sm" dot>
            Pending Approval
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      className: 'text-right',
      cell: () => (
        <Button variant="ghost" size="sm">
          <X className="h-4 w-4" />
          Cancel
        </Button>
      ),
    },
  ];

  return (
    <PageShell title="Book an Amenity" description="Reserve building amenities for your use.">
      {/* Amenity Cards Grid */}
      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AMENITIES.map((amenity) => (
          <Card key={amenity.id} hoverable className="flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div className="bg-primary-50 text-primary-600 flex h-10 w-10 items-center justify-center rounded-xl">
                  {getAmenityIcon(amenity.icon)}
                </div>
                <Badge variant={amenity.available ? 'success' : 'default'} size="sm" dot>
                  {amenity.available ? 'Available' : 'Unavailable'}
                </Badge>
              </div>
              <div className="mt-4">
                <h3 className="text-[16px] font-semibold text-neutral-900">{amenity.name}</h3>
              </div>
              <div className="mt-3 flex flex-col gap-1.5 text-[13px] text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-neutral-400" />
                  Capacity: {amenity.capacity}
                </span>
                {amenity.fee !== null && amenity.fee > 0 ? (
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-neutral-400" />${amenity.fee} per
                    booking
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-neutral-400" />
                    Free
                  </span>
                )}
              </div>
            </div>
            <div className="mt-5">
              <Button size="sm" fullWidth disabled={!amenity.available}>
                Book Now
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* My Upcoming Bookings */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-[14px] font-semibold text-neutral-900">My Upcoming Bookings</h2>
          <Badge variant="primary" size="sm">
            {MY_BOOKINGS.length}
          </Badge>
        </div>
        <DataTable
          columns={bookingColumns}
          data={MY_BOOKINGS}
          emptyMessage="You have no upcoming bookings."
          emptyIcon={<Calendar className="h-6 w-6" />}
        />
      </div>
    </PageShell>
  );
}
