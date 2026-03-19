'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertTriangle,
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
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompletionRecord {
  id?: string;
  completedAt: string;
  completedById: string;
  notes: string | null;
}

interface RecurringTaskData {
  id: string;
  name: string;
  description?: string | null;
  intervalType: string;
  isActive: boolean;
  startDate: string;
  nextOccurrence: string | null;
  notes?: string | null;
  location?: string | null;
  assignedEmployeeId?: string | null;
  defaultPriority?: string;
  isOverdue?: boolean;
  category?: { id: string; name: string } | null;
  equipment?: { id: string; name: string } | null;
  completions?: CompletionRecord[];
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semiannually: 'Semi-annually',
  annually: 'Annually',
};

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'default'> = {
  active: 'success',
  paused: 'warning',
  completed: 'default',
};

const PRIORITY_LABELS: Record<string, string> = { low: 'Low', medium: 'Medium', high: 'High' };
const PRIORITY_VARIANT: Record<string, 'default' | 'info' | 'warning'> = {
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

function RecurringTaskSkeleton() {
  return (
    <PageShell title="" description="">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RecurringTaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [task, setTask] = useState<RecurringTaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchTask() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/recurring-tasks/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error(`Failed to fetch task (${res.status})`);
        const json = await res.json();
        setTask(json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchTask();
  }, [id]);

  if (loading) return <RecurringTaskSkeleton />;

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <Repeat className="h-12 w-12 text-neutral-300" />
        <h1 className="text-[20px] font-bold text-neutral-900">Recurring task not found</h1>
        <p className="text-[14px] text-neutral-500">
          The recurring task you are looking for does not exist.
        </p>
        <Button variant="secondary" onClick={() => router.push('/recurring-tasks')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Recurring Tasks
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
        <AlertTriangle className="text-error-500 h-12 w-12" />
        <h1 className="text-[20px] font-bold text-neutral-900">Error loading task</h1>
        <p className="text-[14px] text-neutral-500">{error}</p>
        <Button variant="secondary" onClick={() => router.push('/recurring-tasks')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Recurring Tasks
        </Button>
      </div>
    );
  }

  if (!task) return null;

  const isOverdue =
    task.isOverdue || (task.nextOccurrence ? daysUntil(task.nextOccurrence) < 0 : false);
  const daysUntilDue = task.nextOccurrence ? daysUntil(task.nextOccurrence) : null;
  const completions = task.completions || [];
  const completionRate = completions.length > 0 ? 100 : 0; // Simplified; real would compute from history
  const statusLabel = task.isActive ? 'Active' : 'Paused';
  const statusVariant = task.isActive ? 'success' : 'warning';
  const priority = task.defaultPriority || 'medium';

  return (
    <PageShell
      title={task.name}
      description={`${FREQUENCY_LABELS[task.intervalType] || task.intervalType} task`}
      actions={
        <Button variant="secondary" size="sm" onClick={() => router.push('/recurring-tasks')}>
          <ArrowLeft className="h-4 w-4" />
          Back to Recurring Tasks
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                {task.category && (
                  <div>
                    <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                      Category
                    </dt>
                    <dd className="mt-1">
                      <Badge variant="info">{task.category.name}</Badge>
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Frequency
                  </dt>
                  <dd className="mt-1">
                    <Badge variant="default">
                      {FREQUENCY_LABELS[task.intervalType] || task.intervalType}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Priority
                  </dt>
                  <dd className="mt-1">
                    <Badge variant={PRIORITY_VARIANT[priority] || 'default'} dot>
                      {PRIORITY_LABELS[priority] || priority}
                    </Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Status
                  </dt>
                  <dd className="mt-1">
                    <Badge variant={statusVariant as 'success' | 'warning'} dot>
                      {statusLabel}
                    </Badge>
                  </dd>
                </div>
                {task.location && (
                  <div>
                    <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                      Location
                    </dt>
                    <dd className="mt-1 text-[14px] text-neutral-900">{task.location}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Start Date
                  </dt>
                  <dd className="mt-1 text-[14px] text-neutral-900">
                    {formatDate(task.startDate)}
                  </dd>
                </div>
                {task.equipment && (
                  <div>
                    <dt className="text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                      Linked Equipment
                    </dt>
                    <dd className="mt-1 text-[14px] text-neutral-900">{task.equipment.name}</dd>
                  </div>
                )}
              </dl>
              {(task.notes || task.description) && (
                <div className="mt-5 border-t border-neutral-100 pt-4">
                  <dt className="mb-1 text-[12px] font-semibold tracking-wide text-neutral-400 uppercase">
                    Notes
                  </dt>
                  <dd className="text-[13px] leading-relaxed text-neutral-600">
                    {task.notes || task.description}
                  </dd>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completion History */}
          {completions.length > 0 && (
            <Card padding="md">
              <CardHeader>
                <CardTitle>Completion History</CardTitle>
                <Badge variant="default" size="sm">
                  {completions.length} records
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
                      </tr>
                    </thead>
                    <tbody>
                      {completions.map((record, idx) => (
                        <tr
                          key={record.id || idx}
                          className="border-b border-neutral-50 last:border-0"
                        >
                          <td className="py-3 text-[13px] text-neutral-600">
                            {formatDate(record.completedAt)}
                          </td>
                          <td className="py-3 text-[13px] font-medium text-neutral-900">
                            {record.completedById}
                          </td>
                          <td className="py-3 text-[13px] text-neutral-700">
                            {record.notes || '\u2014'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Due */}
          {task.nextOccurrence && (
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
                        {formatDate(task.nextOccurrence)}
                      </p>
                      <p
                        className={`text-[13px] font-medium ${isOverdue ? 'text-error-600' : 'text-neutral-500'}`}
                      >
                        {isOverdue
                          ? `${Math.abs(daysUntilDue!)} days overdue`
                          : daysUntilDue === 0
                            ? 'Due today'
                            : `${daysUntilDue} days remaining`}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
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
                  {task.isActive ? 'Pause Task' : 'Resume Task'}
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
                      {(FREQUENCY_LABELS[task.intervalType] || task.intervalType).toLowerCase()}
                    </span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
