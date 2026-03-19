'use client';

import { PageShell } from '@/components/layout/page-shell';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, MapPin, CheckCircle2 } from 'lucide-react';

const TODAY_SCHEDULE = [
  {
    time: '7:00 AM',
    task: 'Morning lobby walkthrough',
    location: 'Lobby',
    status: 'completed' as const,
  },
  {
    time: '8:00 AM',
    task: 'Package room check',
    location: 'Package Room',
    status: 'completed' as const,
  },
  {
    time: '9:00 AM',
    task: 'Shift handoff meeting',
    location: 'Front Desk',
    status: 'completed' as const,
  },
  {
    time: '10:00 AM',
    task: 'Fire alarm system test',
    location: 'Mechanical Room',
    status: 'current' as const,
  },
  {
    time: '11:30 AM',
    task: 'Visitor parking audit',
    location: 'Parking Garage',
    status: 'upcoming' as const,
  },
  {
    time: '1:00 PM',
    task: 'Pool area inspection',
    location: 'Pool Deck',
    status: 'upcoming' as const,
  },
  {
    time: '2:30 PM',
    task: 'Contractor escort - HVAC vendor',
    location: 'Unit 1205',
    status: 'upcoming' as const,
  },
  {
    time: '3:00 PM',
    task: 'Evening shift prep',
    location: 'Front Desk',
    status: 'upcoming' as const,
  },
];

const STATUS_STYLE = {
  completed: { color: 'text-success-600', bg: 'bg-success-50', badge: 'success' as const },
  current: { color: 'text-primary-600', bg: 'bg-primary-50', badge: 'primary' as const },
  upcoming: { color: 'text-neutral-400', bg: 'bg-neutral-50', badge: 'default' as const },
};

export default function MySchedulePage() {
  const completed = TODAY_SCHEDULE.filter((t) => t.status === 'completed').length;

  return (
    <PageShell title="My Schedule" description="Your tasks and assignments for today.">
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card padding="sm">
          <p className="text-[12px] font-medium text-neutral-500 uppercase">Today&apos;s Tasks</p>
          <p className="text-[24px] font-bold text-neutral-900">{TODAY_SCHEDULE.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[12px] font-medium text-neutral-500 uppercase">Completed</p>
          <p className="text-success-600 text-[24px] font-bold">{completed}</p>
        </Card>
        <Card padding="sm">
          <p className="text-[12px] font-medium text-neutral-500 uppercase">Remaining</p>
          <p className="text-primary-600 text-[24px] font-bold">
            {TODAY_SCHEDULE.length - completed}
          </p>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        {TODAY_SCHEDULE.map((item, idx) => {
          const style = STATUS_STYLE[item.status];
          return (
            <Card key={idx} hoverable>
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${style.bg}`}
                >
                  {item.status === 'completed' ? (
                    <CheckCircle2 className={`h-5 w-5 ${style.color}`} />
                  ) : (
                    <Clock className={`h-5 w-5 ${style.color}`} />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-[14px] font-semibold ${item.status === 'completed' ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}
                    >
                      {item.task}
                    </p>
                    <Badge variant={style.badge} size="sm">
                      {item.status === 'completed'
                        ? 'Done'
                        : item.status === 'current'
                          ? 'Now'
                          : item.time}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[12px] text-neutral-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {item.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {item.location}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
