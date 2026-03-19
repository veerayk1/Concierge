'use client';

import { useMemo } from 'react';
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  Play,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  lessons: number;
  completedLessons: number;
  status: 'not_started' | 'in_progress' | 'completed';
  required: boolean;
  dueDate?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TrainingPage() {
  const {
    data: apiCourses,
    loading,
    error,
    refetch,
  } = useApi<Course[]>(apiUrl('/api/v1/training', { propertyId: DEMO_PROPERTY_ID }));

  const allCourses = useMemo<Course[]>(() => apiCourses ?? [], [apiCourses]);

  const completedCount = allCourses.filter((c) => c.status === 'completed').length;
  const inProgressCount = allCourses.filter((c) => c.status === 'in_progress').length;
  const requiredCount = allCourses.filter((c) => c.required).length;
  const completedRequired = allCourses.filter((c) => c.required && c.status === 'completed').length;

  return (
    <PageShell
      title="Training & LMS"
      description="Staff training courses with quizzes and progress tracking."
    >
      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="mt-3 text-[14px] text-neutral-500">Loading training courses...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Failed to load training courses"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      )}

      {!loading && !error && (
        <>
          {/* Empty State */}
          {allCourses.length === 0 ? (
            <EmptyState
              icon={<GraduationCap className="h-6 w-6" />}
              title="No training courses"
              description="Training courses will appear here once they are assigned to your role."
            />
          ) : (
            <>
              {/* Progress Summary */}
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
                <Card padding="sm" className="flex items-center gap-4">
                  <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
                    <CheckCircle2 className="text-success-600 h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                      {completedCount}
                    </p>
                    <p className="text-[13px] text-neutral-500">Completed</p>
                  </div>
                </Card>
                <Card padding="sm" className="flex items-center gap-4">
                  <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
                    <Play className="text-primary-600 h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                      {inProgressCount}
                    </p>
                    <p className="text-[13px] text-neutral-500">In Progress</p>
                  </div>
                </Card>
                <Card padding="sm" className="flex items-center gap-4">
                  <div className="bg-warning-50 flex h-10 w-10 items-center justify-center rounded-xl">
                    <Award className="text-warning-600 h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                      {completedRequired}/{requiredCount}
                    </p>
                    <p className="text-[13px] text-neutral-500">Required Done</p>
                  </div>
                </Card>
                <Card padding="sm" className="flex items-center gap-4">
                  <div className="bg-info-50 flex h-10 w-10 items-center justify-center rounded-xl">
                    <BookOpen className="text-info-600 h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                      {allCourses.length}
                    </p>
                    <p className="text-[13px] text-neutral-500">Total Courses</p>
                  </div>
                </Card>
              </div>

              {/* Course List */}
              <div className="flex flex-col gap-4">
                {allCourses.map((course) => {
                  const progress =
                    course.lessons > 0
                      ? Math.round((course.completedLessons / course.lessons) * 100)
                      : 0;
                  return (
                    <Card key={course.id} hoverable className="cursor-pointer">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="bg-primary-50 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                            <GraduationCap className="text-primary-600 h-6 w-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-[16px] font-semibold text-neutral-900">
                                {course.title}
                              </h3>
                              {course.required && (
                                <Badge variant="error" size="sm">
                                  Required
                                </Badge>
                              )}
                              {course.status === 'completed' && (
                                <Badge variant="success" size="sm" dot>
                                  Completed
                                </Badge>
                              )}
                              {course.status === 'in_progress' && (
                                <Badge variant="primary" size="sm" dot>
                                  In Progress
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 text-[14px] leading-relaxed text-neutral-600">
                              {course.description}
                            </p>
                            <div className="mt-3 flex items-center gap-4 text-[12px] text-neutral-400">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {course.duration}
                              </span>
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {course.lessons} lessons
                              </span>
                              <Badge variant="default" size="sm">
                                {course.category}
                              </Badge>
                              {course.dueDate && (
                                <span className="text-warning-600">
                                  Due:{' '}
                                  {new Date(course.dueDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {course.status === 'not_started' && (
                            <Button size="sm">Start Course</Button>
                          )}
                          {course.status === 'in_progress' && <Button size="sm">Continue</Button>}
                          {course.status === 'completed' && (
                            <Button variant="secondary" size="sm">
                              Review
                            </Button>
                          )}
                          {course.status !== 'not_started' && (
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-neutral-200">
                                <div
                                  className={`h-full rounded-full ${progress === 100 ? 'bg-success-500' : 'bg-primary-500'}`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-[12px] font-medium text-neutral-500">
                                {progress}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </PageShell>
  );
}
