'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Edit2, MapPin, Plus, Users, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const MOCK = {
  name: 'Rooftop Pool',
  category: 'Recreation',
  location: 'Floor 25, Rooftop',
  capacity: 30,
  description:
    'Heated outdoor pool with panoramic city views. Open seasonally from May to October. Towels provided. Maximum 2 guests per resident.',
  hours: 'Mon-Sun: 7:00 AM - 10:00 PM',
  rules: [
    'No diving',
    'Children under 12 must be accompanied by an adult',
    'No glass containers',
    'Shower before entering the pool',
  ],
  availableNow: true,
  requiresApproval: false,
  fee: 0,
  upcomingBookings: [
    {
      id: '1',
      resident: 'Janet Smith',
      unit: '1501',
      date: '2026-03-18',
      time: '2:00 PM - 4:00 PM',
      guests: 2,
    },
    {
      id: '2',
      resident: 'David Chen',
      unit: '802',
      date: '2026-03-18',
      time: '5:00 PM - 7:00 PM',
      guests: 1,
    },
    {
      id: '3',
      resident: 'Maria Garcia',
      unit: '1203',
      date: '2026-03-19',
      time: '10:00 AM - 12:00 PM',
      guests: 3,
    },
  ],
};

interface AmenityDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AmenityDetailPage({ params }: AmenityDetailPageProps) {
  const { id } = use(params);

  return (
    <div className="flex flex-col gap-6">
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
          </div>
          <p className="text-[14px] text-neutral-500">
            {MOCK.category} &middot; {MOCK.location}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Book Now
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <Card>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
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
                    Approval
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">
                    {MOCK.requiresApproval ? 'Required' : 'Not required'}
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
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">
                Upcoming Bookings ({MOCK.upcomingBookings.length})
              </h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-3">
                {MOCK.upcomingBookings.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-xl border border-neutral-100 p-4"
                  >
                    <div>
                      <p className="text-[14px] font-medium text-neutral-900">
                        {b.resident} <span className="text-neutral-500">· Unit {b.unit}</span>
                      </p>
                      <p className="mt-0.5 text-[13px] text-neutral-500">
                        {new Date(b.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        &middot; {b.time}
                      </p>
                    </div>
                    <Badge variant="default" size="sm">
                      {b.guests} {b.guests === 1 ? 'guest' : 'guests'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
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
        </div>
      </div>
    </div>
  );
}
