'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Pause,
  Edit,
  Trash2,
  Repeat,
  Calendar,
  Clock,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TaskCategory = 'maintenance' | 'cleaning' | 'inspection' | 'safety' | 'administrative';
type TaskFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';
type TaskStatus = 'active' | 'paused' | 'completed';
type TaskPriority = 'low' | 'medium' | 'high';

interface CompletionRecord {
  dateCompleted: string;
  completedBy: string;
  notes: string;
  onTime: boolean;
}

interface RecurringTaskDetail {
  id: string;
  name: string;
  category: TaskCategory;
  frequency: TaskFrequency;
  assignedTo: string;
  location: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: string;
  notes: string;
  nextDue: string;
  completionRate: number;
  completionHistory: CompletionRecord[];
  upcomingOccurrences: string[];
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_TASK: RecurringTaskDetail = {
  id: '1',
  name: 'HVAC Filter Replacement',
  category: 'maintenance',
  frequency: 'monthly',
  assignedTo: 'Mike Chen',
  location: 'Rooftop Mechanical Room',
  priority: 'high',
  status: 'active',
  startDate: '2025-01-15',
  notes:
    'Replace all 4 HVAC filters (MERV-13, 20x25x4). Filters stored in Mechanical Room supply closet. Log old filter condition before disposal. Check belt tension while access panel is open.',
  nextDue: '2026-04-15',
  completionRate: 92,
  completionHistory: [
    {
      dateCompleted: '2026-03-14',
      completedBy: 'Mike Chen',
      notes: 'All 4 filters replaced. Belt tension normal.',
      onTime: true,
    },
    {
      dateCompleted: '2026-02-15',
      completedBy: 'Mike Chen',
      notes: 'Replaced filters. Unit #2 filter was heavily soiled — may need quarterly check.',
      onTime: true,
    },
    {
      dateCompleted: '2026-01-18',
      completedBy: 'Carlos Rivera',
      notes: 'Mike on vacation. Filters replaced — one filter was wrong size, reordered.',
      onTime: false,
    },
    {
      dateCompleted: '2025-12-15',
      completedBy: 'Mike Chen',
      notes: 'Routine replacement. All filters in expected condition.',
      onTime: true,
    },
  ],
  upcomingOccurrences: ['2026-04-15', '2026-05-15', '2026-06-15', '2026-07-15', '2026-08-15'],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CATEGORY_LABELS: Record<TaskCategory, string> = {
  maintenance: 'Maintenance',
  cleaning: 'Cleaning',
  inspection: 'Inspection',
  safety: 'Safety',
  administrative: 'Administrative',
};

const CATEGORY_VARIANT: Record<TaskCategory, 'info' | 'success' | 'warning' | 'error' | 'primary'> =
  {
    maintenance: 'info',
    cleaning: 'success',
    inspection: 'warning',
    safety: 'error',
    administrative: 'primary',
  };

const FREQUENCY_LABELS: Record<TaskFrequency, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annually: 'Annually',
};

const FREQUENCY_VARIANT: Record<
  TaskFrequency,
  'default' | 'info' | 'warning' | 'success' | 'primary'
> = {
  daily: 'primary',
  weekly: 'info',
  biweekly: 'info',
  monthly: 'default',
  quarterly: 'warning',
  annually: 'success',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
};

const STATUS_VARIANT: Record<TaskStatus, 'success' | 'warning' | 'default'> = {
  active: 'success',
  paused: 'warning',
  completed: 'default',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const PRIORITY_VARIANT: Record<TaskPriority, 'default' | 'info' | 'warning'> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
};

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function daysUntil(date: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RecurringTaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const _id = params.id as string;

  // In production this would fetch by id
  const task = MOCK_TASK;
  const daysUntilDue = daysUntil(task.nextDue);
  const isOverdue = daysUntilDue < 0;

  return (
    <PageShell
      title={task.name}
      description={`${FREQUENCY_LABELS[task.frequency]} task assigned to ${task.assignedTo}`}
      actions={
        <Button variant="secondary" size="sm" onClick={() => router.push('/recurring-tasks')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Recurring Tasks
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ---------------------------------------------------------------- */}
        {/* LEFT COLUMN (2/3) */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Task Details */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Name
                  </dt>
                  <dd className="mt-1 text-[14px] font-medium text-neutral-900">{task.name}</dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Category
                  </dt>
                  <dd className="mt-1">
                    <Badge variant={CATEGORY_VARIANT[task.category]}>
                      {CATEGORY_LABELS[task.category]}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Frequency
                  </dt>
                  <dd className="mt-1">
                    <Badge variant={FREQUENCY_VARIANT[task.frequency]}>
                      {FREQUENCY_LABELS[task.frequency]}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Assigned To
                  </dt>
                  <dd className="mt-1 text-[14px] text-neutral-900">{task.assignedTo}</dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Location
                  </dt>
                  <dd className="mt-1 text-[14px] text-neutral-900">{task.location}</dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Priority
                  </dt>
                  <dd className="mt-1">
                    <Badge variant={PRIORITY_VARIANT[task.priority]} dot>
                      {PRIORITY_LABELS[task.priority]}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Status
                  </dt>
                  <dd className="mt-1">
                    <Badge variant={STATUS_VARIANT[task.status]} dot>
                      {STATUS_LABELS[task.status]}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Start Date
                  </dt>
                  <dd className="mt-1 text-[14px] text-neutral-900">
                    {formatDate(task.startDate)}
                  </dd>
                </div>
              </dl>
              {task.notes && (
                <div className="mt-5 border-t border-neutral-100 pt-4">
                  <dt className="mb-1 text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Notes
                  </dt>
                  <dd className="text-[13px] leading-relaxed text-neutral-600">{task.notes}</dd>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completion History */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Completion History</CardTitle>
              <Badge variant="default" size="sm">
                {task.completionHistory.length} records
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-neutral-100">
                      <th className="pb-3 text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                        Date Completed
                      </th>
                      <th className="pb-3 text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                        Completed By
                      </th>
                      <th className="pb-3 text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                        Notes
                      </th>
                      <th className="pb-3 text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                        On Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {task.completionHistory.map((record, idx) => (
                      <tr key={idx} className="border-b border-neutral-50 last:border-0">
                        <td className="py-3 text-[13px] text-neutral-600">
                          {formatDate(record.dateCompleted)}
                        </td>
                        <td className="py-3 text-[13px] font-medium text-neutral-900">
                          {record.completedBy}
                        </td>
                        <td className="py-3 text-[13px] text-neutral-700">{record.notes}</td>
                        <td className="py-3">
                          <Badge variant={record.onTime ? 'success' : 'error'} size="sm">
                            {record.onTime ? 'Yes' : 'No'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Next Due */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Next Due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-neutral-400" />
                  <div>
                    <p className="text-[16px] font-bold text-neutral-900">
                      {formatDate(task.nextDue)}
                    </p>
                    <p
                      className={`text-[13px] font-medium ${isOverdue ? 'text-error-600' : 'text-neutral-500'}`}
                    >
                      {isOverdue
                        ? `${Math.abs(daysUntilDue)} days overdue`
                        : daysUntilDue === 0
                          ? 'Due today'
                          : `${daysUntilDue} days remaining`}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* RIGHT COLUMN (1/3) */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-col gap-6">
          {/* Completion Rate */}
          <Card padding="md" className="flex flex-col items-center gap-4 text-center">
            <p className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
              Completion Rate
            </p>
            <p
              className={`text-[32px] font-bold tracking-tight ${
                task.completionRate >= 90
                  ? 'text-success-600'
                  : task.completionRate >= 70
                    ? 'text-warning-600'
                    : 'text-error-600'
              }`}
            >
              {task.completionRate}%
            </p>
            <div className="w-full">
              <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-full rounded-full transition-all ${
                    task.completionRate >= 90
                      ? 'bg-success-500'
                      : task.completionRate >= 70
                        ? 'bg-warning-500'
                        : 'bg-error-500'
                  }`}
                  style={{ width: `${task.completionRate}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button variant="primary" size="sm" fullWidth>
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Complete
                </Button>
                <Button variant="secondary" size="sm" fullWidth>
                  <Pause className="h-4 w-4" />
                  Pause Task
                </Button>
                <Button variant="secondary" size="sm" fullWidth>
                  <Edit className="h-4 w-4" />
                  Edit Task
                </Button>
                <Button variant="danger" size="sm" fullWidth>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Repeat className="h-4 w-4 text-neutral-400" />
                  <span className="text-[14px] text-neutral-900">
                    Repeats{' '}
                    <span className="font-semibold">
                      {FREQUENCY_LABELS[task.frequency].toLowerCase()}
                    </span>
                  </span>
                </div>
                <div>
                  <p className="mb-2 text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Next 5 Occurrences
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {task.upcomingOccurrences.map((date, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[13px]">
                        <Clock className="h-3.5 w-3.5 text-neutral-300" />
                        <span className="text-neutral-700">{formatDate(date)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
