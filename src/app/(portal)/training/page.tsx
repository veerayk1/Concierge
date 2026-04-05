'use client';

import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  Play,
  Plus,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Types matching what the API actually returns (Prisma Course + modules)
// ---------------------------------------------------------------------------

interface ApiCourseModule {
  id: string;
  title: string;
  sortOrder: number;
}

interface ApiCourse {
  id: string;
  courseCode: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty: string;
  estimatedDurationMinutes: number;
  mandatory: boolean;
  status: string; // draft | published | archived
  passThreshold: number;
  modules: ApiCourseModule[];
  learningPathCourses?: Array<{
    learningPath: { id: string; name: string };
  }>;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TrainingPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const {
    data: apiCourses,
    loading,
    error,
    refetch,
  } = useApi<ApiCourse[]>(apiUrl('/api/v1/training', { propertyId: getPropertyId() }));

  const allCourses = useMemo<ApiCourse[]>(() => apiCourses ?? [], [apiCourses]);

  // GAP 11.2 — Platform Updates learning path (courses tagged with this category)
  const platformUpdateCourses = allCourses.filter(
    (c) =>
      c.category === 'Platform Updates' ||
      c.learningPathCourses?.some((lpc) =>
        lpc.learningPath?.name?.toLowerCase().includes('platform updates'),
      ),
  );

  const totalCount = allCourses.length;
  const publishedCount = allCourses.filter((c) => c.status === 'published').length;
  const draftCount = allCourses.filter((c) => c.status === 'draft').length;
  const mandatoryCount = allCourses.filter((c) => c.mandatory).length;

  const handleCreateCourse = async () => {
    setCreating(true);
    setCreateError(null);
    try {
      const response = await apiRequest(
        apiUrl('/api/v1/training', { propertyId: getPropertyId() }),
        {
          method: 'POST',
          body: {
            propertyId: getPropertyId(),
            title: 'New Training Course',
            description: 'Add a description for this course.',
            estimatedMinutes: 30,
            category: 'General',
            mandatory: false,
          },
        },
      );
      if (response.ok) {
        setCreateError(null);
        const result = await response.json().catch(() => null);
        if (result?.data?.id) {
          router.push(`/training/${result.data.id}`);
        } else {
          await refetch();
        }
      } else {
        const result = await response.json().catch(() => null);
        setCreateError(result?.message || `Failed to create course (${response.status})`);
      }
    } catch {
      setCreateError('An unexpected error occurred. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const difficultyVariant: Record<string, 'default' | 'primary' | 'warning' | 'error'> = {
    beginner: 'default',
    intermediate: 'primary',
    advanced: 'warning',
  };

  const statusVariant: Record<string, 'success' | 'default' | 'warning'> = {
    published: 'success',
    draft: 'default',
    archived: 'warning',
  };

  return (
    <PageShell
      title="Training & LMS"
      description="Staff training courses with quizzes and progress tracking."
      actions={
        <Button size="sm" onClick={handleCreateCourse} loading={creating}>
          <Plus className="h-4 w-4" />
          Create Course
        </Button>
      }
    >
      {/* Create Error */}
      {createError && (
        <div className="border-error-200 bg-error-50 text-error-700 mb-4 rounded-xl border px-4 py-3 text-[14px]">
          {createError}
        </div>
      )}

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

      {/* GAP 11.2 — Platform Updates section (always visible when there are update courses) */}
      {!loading && !error && platformUpdateCourses.length > 0 && (
        <div className="mb-6 rounded-2xl border border-violet-200 bg-violet-50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-violet-600" />
            <h2 className="text-[15px] font-semibold text-violet-900">Platform Updates</h2>
            <span className="ml-auto rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
              {platformUpdateCourses.length} update{platformUpdateCourses.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {platformUpdateCourses.map((course) => (
              <div
                key={course.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md"
                onClick={() => router.push(`/training/${course.id}`)}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100">
                  <Zap className="h-4 w-4 text-violet-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-medium text-neutral-900">{course.title}</p>
                  {course.description && (
                    <p className="truncate text-[12px] text-neutral-500">{course.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-neutral-400">
                    {formatDuration(course.estimatedDurationMinutes)}
                  </span>
                  <Badge
                    variant={course.status === 'published' ? 'success' : 'default'}
                    size="sm"
                    dot
                  >
                    {course.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Empty State */}
          {allCourses.length === 0 ? (
            <EmptyState
              icon={<GraduationCap className="h-6 w-6" />}
              title="No training courses"
              description="Create your first course to start building your training program."
              action={
                <Button size="sm" onClick={handleCreateCourse} loading={creating}>
                  <Plus className="h-4 w-4" />
                  Create Course
                </Button>
              }
            />
          ) : (
            <>
              {/* Summary Cards */}
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-4">
                <Card padding="sm" className="flex items-center gap-4">
                  <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
                    <BookOpen className="text-primary-600 h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                      {totalCount}
                    </p>
                    <p className="text-[13px] text-neutral-500">Total Courses</p>
                  </div>
                </Card>
                <Card padding="sm" className="flex items-center gap-4">
                  <div className="bg-success-50 flex h-10 w-10 items-center justify-center rounded-xl">
                    <CheckCircle2 className="text-success-600 h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                      {publishedCount}
                    </p>
                    <p className="text-[13px] text-neutral-500">Published</p>
                  </div>
                </Card>
                <Card padding="sm" className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100">
                    <Clock className="h-5 w-5 text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                      {draftCount}
                    </p>
                    <p className="text-[13px] text-neutral-500">Drafts</p>
                  </div>
                </Card>
                <Card padding="sm" className="flex items-center gap-4">
                  <div className="bg-warning-50 flex h-10 w-10 items-center justify-center rounded-xl">
                    <Award className="text-warning-600 h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[24px] font-bold tracking-tight text-neutral-900">
                      {mandatoryCount}
                    </p>
                    <p className="text-[13px] text-neutral-500">Mandatory</p>
                  </div>
                </Card>
              </div>

              {/* Course List */}
              <div className="flex flex-col gap-4">
                {allCourses.map((course) => (
                  <Card
                    key={course.id}
                    hoverable
                    className="cursor-pointer"
                    onClick={() => router.push(`/training/${course.id}`)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="bg-primary-50 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                          <GraduationCap className="text-primary-600 h-6 w-6" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[16px] font-semibold text-neutral-900">
                              {course.title}
                            </h3>
                            {course.mandatory && (
                              <Badge variant="error" size="sm">
                                Required
                              </Badge>
                            )}
                            <Badge
                              variant={statusVariant[course.status] || 'default'}
                              size="sm"
                              dot
                            >
                              {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                            </Badge>
                          </div>
                          {course.description && (
                            <p className="mt-1 text-[14px] leading-relaxed text-neutral-600">
                              {course.description}
                            </p>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-4 text-[12px] text-neutral-400">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDuration(course.estimatedDurationMinutes)}
                            </span>
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {course.modules.length} module{course.modules.length !== 1 ? 's' : ''}
                            </span>
                            {course.category && (
                              <Badge variant="default" size="sm">
                                {course.category}
                              </Badge>
                            )}
                            <Badge
                              variant={difficultyVariant[course.difficulty] || 'default'}
                              size="sm"
                            >
                              {course.difficulty.charAt(0).toUpperCase() +
                                course.difficulty.slice(1)}
                            </Badge>
                            <span className="font-mono text-neutral-300">{course.courseCode}</span>
                          </div>
                          {course.learningPathCourses && course.learningPathCourses.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {course.learningPathCourses
                                .filter((lpc) => lpc.learningPath)
                                .map((lpc) => (
                                  <Badge key={lpc.learningPath.id} variant="info" size="sm">
                                    {lpc.learningPath.name}
                                  </Badge>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-[13px] text-neutral-400">
                          Pass: {course.passThreshold}%
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </PageShell>
  );
}
