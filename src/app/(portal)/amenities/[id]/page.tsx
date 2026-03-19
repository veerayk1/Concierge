'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Ban,
  Calendar,
  Check,
  Clock,
  DollarSign,
  Edit2,
  FileText,
  MapPin,
  Plus,
  Settings,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const MOCK = {
  name: 'Party Room',
  category: 'Entertainment',
  location: 'Floor 2, Room 201',
  capacity: 40,
  description:
    'Spacious party room with full kitchen, bar area, and lounge seating. Perfect for birthday parties, family gatherings, and private events. Includes built-in AV system with projector and sound.',
  hours: 'Mon-Thu: 9:00 AM - 10:00 PM, Fri-Sun: 9:00 AM - 12:00 AM',
  rules: [
    'Maximum 40 guests including residents',
    'Music must be turned off by 11:00 PM on weekdays',
    'Resident must be present for the entire booking',
    'Clean-up must be completed within 1 hour after booking ends',
    'No smoking or vaping inside the party room',
    'Security deposit will be forfeited if damage occurs',
  ],
  fee: 75,
  securityDeposit: 250,
  availableNow: true,
  requiresApproval: true,
  upcomingBookings: [
    {
      id: '1',
      resident: 'Janet Smith',
      unit: '1501',
      date: '2026-03-20',
      timeSlot: '6:00 PM - 10:00 PM',
      status: 'confirmed' as const,
    },
    {
      id: '2',
      resident: 'David Chen',
      unit: '802',
      date: '2026-03-22',
      timeSlot: '2:00 PM - 6:00 PM',
      status: 'pending' as const,
    },
    {
      id: '3',
      resident: 'Maria Garcia',
      unit: '1203',
      date: '2026-03-25',
      timeSlot: '5:00 PM - 9:00 PM',
      status: 'confirmed' as const,
    },
    {
      id: '4',
      resident: 'James Wilson',
      unit: '410',
      date: '2026-03-28',
      timeSlot: '12:00 PM - 4:00 PM',
      status: 'cancelled' as const,
    },
  ],
  weekAvailability: [
    { day: 'Mon', slots: ['9-12', '12-3', '3-6', '6-10'], booked: [false, false, true, false] },
    { day: 'Tue', slots: ['9-12', '12-3', '3-6', '6-10'], booked: [false, true, false, false] },
    { day: 'Wed', slots: ['9-12', '12-3', '3-6', '6-10'], booked: [false, false, false, true] },
    { day: 'Thu', slots: ['9-12', '12-3', '3-6', '6-10'], booked: [true, false, false, false] },
    { day: 'Fri', slots: ['9-12', '12-3', '3-6', '6-12'], booked: [false, false, true, true] },
    { day: 'Sat', slots: ['9-12', '12-3', '3-6', '6-12'], booked: [true, true, false, false] },
    { day: 'Sun', slots: ['9-12', '12-3', '3-6', '6-12'], booked: [false, false, false, false] },
  ],
};

const statusVariants: Record<string, 'success' | 'warning' | 'error'> = {
  confirmed: 'success',
  pending: 'warning',
  cancelled: 'error',
};

interface AmenityDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AmenityDetailPage({ params }: AmenityDetailPageProps) {
  const { id } = use(params);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <Link
            href="/amenities"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to amenities
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[28px] font-bold tracking-tight text-neutral-900">{MOCK.name}</h1>
            <Badge variant={MOCK.availableNow ? 'success' : 'default'} size="lg" dot>
              {MOCK.availableNow ? 'Available' : 'Booked'}
            </Badge>
            {MOCK.requiresApproval && (
              <Badge variant="info" size="lg">
                Approval Required
              </Badge>
            )}
          </div>
          <p className="text-[14px] text-neutral-500">
            {MOCK.category} &middot; {MOCK.location}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Edit2 className="h-4 w-4" />
            Edit Amenity
          </Button>
          <Button variant="secondary" size="sm">
            <DollarSign className="h-4 w-4" />
            Set Rates
          </Button>
          <Button variant="secondary" size="sm">
            <FileText className="h-4 w-4" />
            Manage Rules
          </Button>
          <Button variant="ghost" size="sm" className="text-error-600">
            <Ban className="h-4 w-4" />
            Disable Bookings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Amenity Info */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Amenity Information</h2>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Name
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">{MOCK.name}</p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Location
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] text-neutral-900">
                    <MapPin className="h-4 w-4 text-neutral-400" />
                    {MOCK.location}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Capacity
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] text-neutral-900">
                    <Users className="h-4 w-4 text-neutral-400" />
                    {MOCK.capacity} people
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Hours
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] text-neutral-900">
                    <Clock className="h-4 w-4 text-neutral-400" />
                    {MOCK.hours}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Fee
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">
                    {MOCK.fee === 0 ? 'Free' : `$${MOCK.fee}/booking`}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Security Deposit
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">
                    {MOCK.securityDeposit === 0 ? 'None' : `$${MOCK.securityDeposit}`}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Description
                  </p>
                  <p className="mt-1 text-[15px] leading-relaxed text-neutral-700">
                    {MOCK.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Bookings */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-neutral-400" />
                <h2 className="text-[14px] font-semibold text-neutral-900">
                  Upcoming Bookings ({MOCK.upcomingBookings.length})
                </h2>
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4" />
                New Booking
              </Button>
            </div>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      <th className="pb-3 text-left text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                        Date
                      </th>
                      <th className="pb-3 text-left text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                        Time Slot
                      </th>
                      <th className="pb-3 text-left text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                        Resident
                      </th>
                      <th className="pb-3 text-left text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                        Unit
                      </th>
                      <th className="pb-3 text-left text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                        Status
                      </th>
                      <th className="pb-3 text-right text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK.upcomingBookings.map((b) => (
                      <tr key={b.id} className="border-b border-neutral-50 last:border-0">
                        <td className="py-3 text-[14px] text-neutral-900">
                          {new Date(b.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="py-3 text-[14px] text-neutral-600">{b.timeSlot}</td>
                        <td className="py-3 text-[14px] font-medium text-neutral-900">
                          {b.resident}
                        </td>
                        <td className="py-3 text-[14px] text-neutral-600">{b.unit}</td>
                        <td className="py-3">
                          <Badge variant={statusVariants[b.status]} size="sm" dot>
                            {b.status}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          {b.status === 'pending' && (
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="sm">
                                <Check className="text-success-600 h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <X className="text-error-600 h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                          {b.status === 'confirmed' && (
                            <Button variant="ghost" size="sm" className="text-error-600">
                              Cancel
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Availability */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Weekly Availability</h2>
            </div>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="pb-3 text-left text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                        Day
                      </th>
                      {(MOCK.weekAvailability[0]?.slots ?? []).map((slot) => (
                        <th
                          key={slot}
                          className="pb-3 text-center text-[12px] font-medium tracking-wide text-neutral-400 uppercase"
                        >
                          {slot}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK.weekAvailability.map((day) => (
                      <tr key={day.day} className="border-b border-neutral-50 last:border-0">
                        <td className="py-2.5 text-[14px] font-medium text-neutral-900">
                          {day.day}
                        </td>
                        {day.booked.map((isBooked, i) => (
                          <td key={i} className="py-2.5 text-center">
                            <span
                              className={`inline-flex h-8 w-full max-w-[80px] items-center justify-center rounded-lg text-[12px] font-medium ${
                                isBooked
                                  ? 'bg-error-50 text-error-600'
                                  : 'bg-success-50 text-success-600'
                              }`}
                            >
                              {isBooked ? 'Booked' : 'Open'}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Rules */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Rules & Guidelines</h2>
            <CardContent>
              <ul className="flex flex-col gap-2">
                {MOCK.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14px] text-neutral-700">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-400" />
                    {rule}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Quick Info</h2>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-neutral-600">Booking Fee</span>
                  <span className="text-[14px] font-medium text-neutral-900">
                    {MOCK.fee === 0 ? 'Free' : `$${MOCK.fee}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-neutral-600">Security Deposit</span>
                  <span className="text-[14px] font-medium text-neutral-900">
                    ${MOCK.securityDeposit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-neutral-600">Capacity</span>
                  <span className="text-[14px] font-medium text-neutral-900">
                    {MOCK.capacity} people
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-neutral-600">Approval</span>
                  <Badge variant={MOCK.requiresApproval ? 'warning' : 'success'} size="sm">
                    {MOCK.requiresApproval ? 'Required' : 'Auto-approve'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
