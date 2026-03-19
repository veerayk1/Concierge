'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Ban,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  LogIn,
  LogOut,
  MapPin,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Mock Data — Party Room Booking
// ---------------------------------------------------------------------------

const MOCK_BOOKING = {
  id: '1',
  reference: 'BK-2934',
  status: 'confirmed' as
    | 'requested'
    | 'pending_approval'
    | 'confirmed'
    | 'checked_in'
    | 'completed'
    | 'cancelled',
  amenity: {
    name: 'Party Room',
    location: 'Tower A, Ground Floor',
    capacity: 50,
    todayBookings: 3,
  },
  date: '2026-04-05',
  timeStart: '18:00',
  timeEnd: '22:00',
  resident: 'David Chen',
  unit: '2204',
  building: 'Tower A',
  guests: 25,
  purpose:
    'Birthday celebration for family member. Will have catering delivered around 5:30 PM. Music will be kept at moderate volume. Cleanup will be done before midnight.',
  createdAt: '2026-03-12T14:30:00',
  rules: [
    'Maximum occupancy of 50 persons must not be exceeded',
    'Music must end by 11:00 PM',
    'No smoking or vaping in the party room',
    'Resident is responsible for cleanup within 1 hour of booking end time',
    'Catering deliveries must be coordinated with front desk',
    'Any damage will be deducted from the security deposit',
  ],
  fees: {
    rental: 150.0,
    securityDeposit: 300.0,
    depositStatus: 'held' as const,
    total: 450.0,
    paymentStatus: 'paid' as const,
    paymentMethod: 'Credit Card ending in 4821',
    paidAt: '2026-03-12T14:35:00',
  },
  timeline: [
    {
      id: 't1',
      status: 'requested',
      label: 'Requested',
      timestamp: '2026-03-12T14:30:00',
      completed: true,
    },
    {
      id: 't2',
      status: 'pending_approval',
      label: 'Pending Approval',
      timestamp: '2026-03-12T14:30:00',
      completed: true,
    },
    {
      id: 't3',
      status: 'confirmed',
      label: 'Confirmed',
      timestamp: '2026-03-13T09:00:00',
      completed: true,
    },
    {
      id: 't4',
      status: 'checked_in',
      label: 'Checked In',
      timestamp: null,
      completed: false,
    },
    {
      id: 't5',
      status: 'completed',
      label: 'Completed',
      timestamp: null,
      completed: false,
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getStatusConfig(status: string): {
  variant: 'success' | 'warning' | 'info' | 'error' | 'default' | 'primary';
  label: string;
} {
  switch (status) {
    case 'requested':
      return { variant: 'default', label: 'Requested' };
    case 'pending_approval':
      return { variant: 'warning', label: 'Pending Approval' };
    case 'confirmed':
      return { variant: 'success', label: 'Confirmed' };
    case 'checked_in':
      return { variant: 'info', label: 'Checked In' };
    case 'completed':
      return { variant: 'primary', label: 'Completed' };
    case 'cancelled':
      return { variant: 'error', label: 'Cancelled' };
    default:
      return { variant: 'default', label: status };
  }
}

function getPaymentVariant(status: string): 'success' | 'warning' | 'error' | 'default' {
  switch (status) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'refunded':
      return 'info' as 'success';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function BookingDetailPage({ params }: BookingDetailPageProps) {
  const { id } = use(params);
  const booking = { ...MOCK_BOOKING, id };

  const statusConfig = getStatusConfig(booking.status);
  const bookingDate = new Date(booking.date);

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
            <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
              Booking #{booking.reference}
            </h1>
            <Badge variant={statusConfig.variant} size="lg" dot>
              {statusConfig.label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <MessageSquare className="h-4 w-4" />
            Message Resident
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Booking Details */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Booking Details</h2>
            </div>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Amenity
                  </p>
                  <p className="mt-1 text-[15px] font-medium text-neutral-900">
                    {booking.amenity.name}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Date
                  </p>
                  <p className="mt-1 text-[15px] font-medium text-neutral-900">
                    {bookingDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Time Slot
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] text-neutral-900">
                    <Clock className="h-3.5 w-3.5 text-neutral-400" />
                    {booking.timeStart} &ndash; {booking.timeEnd}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Resident
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] font-medium text-neutral-900">
                    <User className="h-3.5 w-3.5 text-neutral-400" />
                    {booking.resident}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Unit
                  </p>
                  <p className="mt-1 text-[15px] text-neutral-900">
                    {booking.building} &middot; Unit {booking.unit}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Guests
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] text-neutral-900">
                    <Users className="h-3.5 w-3.5 text-neutral-400" />
                    {booking.guests} guests
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Purpose / Notes
                  </p>
                  <p className="mt-1 text-[15px] leading-relaxed text-neutral-700">
                    {booking.purpose}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Status Timeline</h2>
            </div>
            <CardContent>
              <div className="relative flex items-start justify-between">
                {/* Connecting line */}
                <div className="absolute top-4 right-8 left-8 h-0.5 bg-neutral-200" />
                <div
                  className="bg-primary-500 absolute top-4 left-8 h-0.5 transition-all"
                  style={{
                    width: `${((booking.timeline.filter((t) => t.completed).length - 1) / (booking.timeline.length - 1)) * 100}%`,
                  }}
                />

                {booking.timeline.map((step) => (
                  <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                        step.completed
                          ? 'border-primary-500 bg-primary-500 text-white'
                          : 'border-neutral-300 bg-white text-neutral-400'
                      }`}
                    >
                      {step.completed ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <p
                      className={`text-center text-[12px] font-medium ${
                        step.completed ? 'text-neutral-900' : 'text-neutral-400'
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.timestamp && (
                      <p className="text-[11px] text-neutral-400">
                        {new Date(step.timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Rules Acknowledgment */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Rules Acknowledged</h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-2">
                {booking.rules.map((rule, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2"
                  >
                    <CheckCircle2 className="text-success-600 mt-0.5 h-4 w-4 shrink-0" />
                    <span className="text-[13px] text-neutral-700">{rule}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fee Summary */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Fee Summary</h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] text-neutral-600">Rental Fee</span>
                  <span className="text-[14px] font-medium text-neutral-900">
                    ${booking.fees.rental.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-neutral-600">Security Deposit</span>
                    <Badge
                      variant={booking.fees.depositStatus === 'held' ? 'warning' : 'success'}
                      size="sm"
                    >
                      {booking.fees.depositStatus === 'held' ? 'Held' : 'Released'}
                    </Badge>
                  </div>
                  <span className="text-[14px] font-medium text-neutral-900">
                    ${booking.fees.securityDeposit.toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-neutral-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-semibold text-neutral-900">Total</span>
                    <span className="text-[15px] font-bold text-neutral-900">
                      ${booking.fees.total.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-neutral-400" />
                    <span className="text-[13px] text-neutral-600">
                      {booking.fees.paymentMethod}
                    </span>
                  </div>
                  <Badge variant={getPaymentVariant(booking.fees.paymentStatus)} size="md" dot>
                    {booking.fees.paymentStatus.charAt(0).toUpperCase() +
                      booking.fees.paymentStatus.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Status Card */}
          <Card>
            <div className="flex flex-col items-center py-2">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                  booking.status === 'confirmed'
                    ? 'bg-success-50'
                    : booking.status === 'pending_approval'
                      ? 'bg-warning-50'
                      : booking.status === 'cancelled'
                        ? 'bg-error-50'
                        : 'bg-neutral-50'
                }`}
              >
                {booking.status === 'confirmed' ? (
                  <CheckCircle2 className="text-success-600 h-7 w-7" />
                ) : booking.status === 'cancelled' ? (
                  <XCircle className="text-error-600 h-7 w-7" />
                ) : (
                  <Clock className="text-warning-600 h-7 w-7" />
                )}
              </div>
              <Badge variant={statusConfig.variant} size="lg" dot className="mt-3">
                {statusConfig.label}
              </Badge>
              <p className="mt-2 text-[12px] text-neutral-400">
                Booked on{' '}
                {new Date(booking.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          </Card>

          {/* Actions */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Actions</h2>
            <CardContent>
              <div className="flex flex-col gap-2">
                {booking.status === 'pending_approval' && (
                  <>
                    <Button fullWidth size="lg">
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </Button>
                    <Button variant="danger" fullWidth>
                      <XCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
                {booking.status === 'confirmed' && (
                  <Button fullWidth size="lg">
                    <LogIn className="h-4 w-4" />
                    Check In
                  </Button>
                )}
                {booking.status === 'checked_in' && (
                  <Button fullWidth size="lg">
                    <LogOut className="h-4 w-4" />
                    Check Out
                  </Button>
                )}
                <Button variant="secondary" fullWidth>
                  <Ban className="h-4 w-4" />
                  Cancel Booking
                </Button>
                <Button variant="secondary" fullWidth>
                  <RotateCcw className="h-4 w-4" />
                  Refund Deposit
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Amenity Info */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Amenity Info</h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Name
                  </span>
                  <span className="text-[13px] font-medium text-neutral-900">
                    {booking.amenity.name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Location
                  </span>
                  <span className="text-[13px] text-neutral-700">{booking.amenity.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Capacity
                  </span>
                  <span className="text-[13px] text-neutral-700">{booking.amenity.capacity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Bookings Today
                  </span>
                  <Badge variant="info" size="md">
                    {booking.amenity.todayBookings} bookings
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
