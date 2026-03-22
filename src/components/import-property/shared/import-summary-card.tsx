'use client';

import {
  Building2,
  Users,
  DoorOpen,
  TreePalm,
  Key,
  Phone,
  Car,
  UserCog,
  Package,
  Wrench,
  CalendarClock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ImportSummaryCardProps {
  data: {
    property?: string;
    units?: number;
    residents?: number;
    amenities?: number;
    fobs?: number;
    buzzerCodes?: number;
    parkingPermits?: number;
    staff?: number;
    packages?: number;
    maintenanceRequests?: number;
    events?: number;
  };
  /** Step indices that were skipped (used to show "Skipped" label) */
  skippedSteps?: number[];
}

interface SummaryLineItem {
  label: string;
  count: number;
  icon: React.ElementType;
  color: string;
  /** Which wizard step this item belongs to (for skipped detection) */
  stepIndex: number;
}

/**
 * Maps wizard step indices to data categories.
 * Step 0 = Property Details (not shown in summary items)
 * Step 1 = Units
 * Step 2 = Residents
 * Step 3 = Amenities
 * Step 4 = FOBs, Buzzer Codes, Parking Permits
 * Step 5 = Staff
 * Step 6 = Packages, Maintenance, Events
 */

export function ImportSummaryCard({ data, skippedSteps = [] }: ImportSummaryCardProps) {
  const skippedSet = new Set(skippedSteps);

  const items: SummaryLineItem[] = [
    {
      label: 'Units',
      count: data.units ?? 0,
      icon: DoorOpen,
      color: 'text-blue-600',
      stepIndex: 1,
    },
    {
      label: 'Residents',
      count: data.residents ?? 0,
      icon: Users,
      color: 'text-green-600',
      stepIndex: 2,
    },
    {
      label: 'Amenities',
      count: data.amenities ?? 0,
      icon: TreePalm,
      color: 'text-purple-600',
      stepIndex: 3,
    },
    {
      label: 'FOBs / Keys',
      count: data.fobs ?? 0,
      icon: Key,
      color: 'text-amber-600',
      stepIndex: 4,
    },
    {
      label: 'Buzzer Codes',
      count: data.buzzerCodes ?? 0,
      icon: Phone,
      color: 'text-indigo-600',
      stepIndex: 4,
    },
    {
      label: 'Parking Permits',
      count: data.parkingPermits ?? 0,
      icon: Car,
      color: 'text-teal-600',
      stepIndex: 4,
    },
    { label: 'Staff', count: data.staff ?? 0, icon: UserCog, color: 'text-rose-600', stepIndex: 5 },
    {
      label: 'Packages',
      count: data.packages ?? 0,
      icon: Package,
      color: 'text-orange-600',
      stepIndex: 6,
    },
    {
      label: 'Maintenance Requests',
      count: data.maintenanceRequests ?? 0,
      icon: Wrench,
      color: 'text-sky-600',
      stepIndex: 6,
    },
    {
      label: 'Events / Incidents',
      count: data.events ?? 0,
      icon: CalendarClock,
      color: 'text-neutral-600',
      stepIndex: 6,
    },
  ];

  const totalImported = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card padding="md">
      <div className="mb-4 flex items-center gap-3">
        <Building2 className="text-primary-600 h-5 w-5" />
        <div>
          <h3 className="text-[15px] font-semibold text-neutral-900">Import Summary</h3>
          {data.property && <p className="text-sm text-neutral-500">{data.property}</p>}
        </div>
        <div className="bg-primary-50 text-primary-700 ml-auto rounded-full px-3 py-1 text-sm font-semibold">
          {totalImported} total records
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => {
          const isSkipped = item.count === 0 && skippedSet.has(item.stepIndex);

          return (
            <div
              key={item.label}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 ${
                item.count > 0 ? 'bg-neutral-50' : ''
              }`}
            >
              <item.icon
                className={`h-4 w-4 ${item.count > 0 ? item.color : 'text-neutral-300'}`}
              />
              <span
                className={`text-sm ${item.count > 0 ? 'text-neutral-700' : 'text-neutral-400'}`}
              >
                {item.label}
              </span>
              <span
                className={`ml-auto text-sm font-semibold ${
                  item.count > 0
                    ? 'text-neutral-900'
                    : isSkipped
                      ? 'text-neutral-400 italic'
                      : 'text-neutral-300'
                }`}
              >
                {isSkipped ? 'Skipped' : item.count}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
