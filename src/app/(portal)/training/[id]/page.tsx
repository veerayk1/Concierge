'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  GraduationCap,
  Lock,
  PlayCircle,
  RotateCcw,
  Shield,
  Users,
  Video,
} from 'lucide-react';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { DEMO_PROPERTY_ID } from '@/lib/demo-config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CourseModule {
  id: string;
  title: string;
  type: string;
  duration: string;
  status: string;
}

interface QuizResults {
  score: number | null;
  passed: boolean | null;
  attempts: number;
  dateCompleted: string | null;
  passingScore: number;
}

interface RelatedCourse {
  id: string;
  title: string;
  difficulty: string;
  duration: string;
}

interface TrainingCourse {
  id: string;
  title: string;
  description: string;
  learningPath: string;
  duration: string;
  difficulty: string;
  mandatory: boolean;
  deadline: string;
  createdAt: string;
  updatedAt: string;
  completionPercentage: number;
  modulesCompleted: number;
  totalModules: number;
  timeSpent: string;
  modules: CourseModule[];
  quizResults: QuizResults;
  assignedRoles: string[];
  relatedCourses: RelatedCourse[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDifficultyVariant(d: string): 'success' | 'warning' | 'error' {
  switch (d) {
    case 'beginner':
      return 'success';
    case 'intermediate':
      return 'warning';
    case 'advanced':
      return 'error';
    default:
      return 'success';
  }
}

function getModuleTypeIcon(type: string) {
  switch (type) {
    case 'video':
      return <Video className="h-4 w-4 text-neutral-500" />;
    case 'quiz':
      return <FileText className="h-4 w-4 text-neutral-500" />;
    case 'reading':
      return <BookOpen className="h-4 w-4 text-neutral-500" />;
    case 'interactive':
      return <PlayCircle className="h-4 w-4 text-neutral-500" />;
    default:
      return <FileText className="h-4 w-4 text-neutral-500" />;
  }
}

function getModuleStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return (
        <Badge variant="success" size="md" dot>
          Completed
        </Badge>
      );
    case 'in_progress':
      return (
        <Badge variant="warning" size="md" dot>
          In Progress
        </Badge>
      );
    case 'locked':
      return (
        <Badge variant="default" size="md">
          <Lock className="h-3 w-3" />
          Locked
        </Badge>
      );
    default:
      return (
        <Badge variant="default" size="md">
          {status}
        </Badge>
      );
  }
}

// ---------------------------------------------------------------------------
// Skeleton Loader
// ---------------------------------------------------------------------------

function TrainingDetailSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="h-4 w-24 rounded bg-neutral-200" />
        <div className="h-7 w-64 rounded bg-neutral-200" />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="flex flex-col gap-6 xl:col-span-2">
          <div className="h-48 rounded-xl bg-neutral-100" />
          <div className="h-40 rounded-xl bg-neutral-100" />
          <div className="h-32 rounded-xl bg-neutral-100" />
        </div>
        <div className="flex flex-col gap-6">
          <div className="h-36 rounded-xl bg-neutral-100" />
          <div className="h-32 rounded-xl bg-neutral-100" />
          <div className="h-28 rounded-xl bg-neutral-100" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TrainingDetailPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: course,
    loading,
    error,
  } = useApi<TrainingCourse>(apiUrl(`/api/v1/training/${id}`, { propertyId: DEMO_PROPERTY_ID }));

  // -- Loading State --
  if (loading) {
    return <TrainingDetailSkeleton />;
  }

  // -- Error State --
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="bg-error-50 flex h-16 w-16 items-center justify-center rounded-full">
          <AlertCircle className="text-error-600 h-8 w-8" />
        </div>
        <h2 className="text-[18px] font-semibold text-neutral-900">
          {error.includes('404') ? 'Course Not Found' : 'Failed to Load Course'}
        </h2>
        <p className="max-w-md text-center text-[14px] text-neutral-500">{error}</p>
        <Link href="/training">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to training
          </Button>
        </Link>
      </div>
    );
  }

  // -- 404 State --
  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
          <GraduationCap className="h-8 w-8 text-neutral-400" />
        </div>
        <h2 className="text-[18px] font-semibold text-neutral-900">Course Not Found</h2>
        <p className="text-[14px] text-neutral-500">
          The training course you are looking for does not exist or has been removed.
        </p>
        <Link href="/training">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Back to training
          </Button>
        </Link>
      </div>
    );
  }

  const modules = course.modules ?? [];
  const quizResults = course.quizResults ?? {
    score: null,
    passed: null,
    attempts: 0,
    dateCompleted: null,
    passingScore: 80,
  };
  const assignedRoles = course.assignedRoles ?? [];
  const relatedCourses = course.relatedCourses ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-3">
          <Link
            href="/training"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to training
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
              {course.title}
            </h1>
            <Badge variant={getDifficultyVariant(course.difficulty)} size="lg">
              {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
            </Badge>
            {course.mandatory && (
              <Badge variant="error" size="lg" dot>
                Mandatory
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <BookOpen className="h-4 w-4" />
            View Syllabus
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Course Info */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Course Information</h2>
            </div>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div className="col-span-2">
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Title
                  </p>
                  <p className="mt-1 text-[15px] font-medium text-neutral-900">{course.title}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Description
                  </p>
                  <p className="mt-1 text-[15px] leading-relaxed text-neutral-700">
                    {course.description}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Learning Path
                  </p>
                  <p className="mt-1">
                    <Badge variant="primary" size="lg">
                      {course.learningPath}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Duration
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[15px] text-neutral-900">
                    <Clock className="h-3.5 w-3.5 text-neutral-400" />
                    {course.duration}
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Difficulty
                  </p>
                  <p className="mt-1">
                    <Badge variant={getDifficultyVariant(course.difficulty)} size="lg">
                      {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
                    </Badge>
                  </p>
                </div>
                <div>
                  <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Deadline
                  </p>
                  <p className="mt-1 text-[15px] font-medium text-neutral-900">
                    {course.deadline
                      ? new Date(course.deadline).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'No deadline'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modules List */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">
                Modules ({modules.length})
              </h2>
            </div>
            <CardContent>
              {modules.length > 0 ? (
                <div className="flex flex-col divide-y divide-neutral-100">
                  {modules.map((mod, index) => (
                    <div
                      key={mod.id}
                      className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-[13px] font-semibold text-neutral-500">
                          {index + 1}
                        </div>
                        <div className="flex items-center gap-2">
                          {getModuleTypeIcon(mod.type)}
                          <div>
                            <p className="text-[14px] font-medium text-neutral-900">{mod.title}</p>
                            <p className="text-[12px] text-neutral-500">
                              {mod.type.charAt(0).toUpperCase() + mod.type.slice(1)} &middot;{' '}
                              {mod.duration}
                            </p>
                          </div>
                        </div>
                      </div>
                      {getModuleStatusBadge(mod.status)}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[14px] text-neutral-400">No modules in this course.</p>
              )}
            </CardContent>
          </Card>

          {/* Quiz Results */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Quiz Results</h2>
            </div>
            <CardContent>
              {quizResults.score !== null ? (
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Score
                    </p>
                    <p className="mt-1 text-[20px] font-bold text-neutral-900">
                      {quizResults.score}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Result
                    </p>
                    <p className="mt-1">
                      <Badge variant={quizResults.passed ? 'success' : 'error'} size="lg" dot>
                        {quizResults.passed ? 'Passed' : 'Failed'}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Attempts
                    </p>
                    <p className="mt-1 text-[15px] text-neutral-900">{quizResults.attempts}</p>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                      Date Completed
                    </p>
                    <p className="mt-1 text-[15px] text-neutral-900">
                      {quizResults.dateCompleted
                        ? new Date(quizResults.dateCompleted).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 py-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100">
                    <FileText className="h-5 w-5 text-neutral-400" />
                  </div>
                  <p className="mt-3 text-[13px] font-medium text-neutral-500">
                    Quiz not yet attempted
                  </p>
                  <p className="mt-1 text-[12px] text-neutral-400">
                    Passing score: {quizResults.passingScore}%
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Progress Card */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Progress</h2>
            </div>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="text-center">
                  <p className="text-[36px] font-bold text-neutral-900">
                    {course.completionPercentage ?? 0}%
                  </p>
                  <p className="text-[13px] text-neutral-500">Complete</p>
                </div>
                {/* Progress bar */}
                <div>
                  <div className="h-3 w-full rounded-full bg-neutral-100">
                    <div
                      className="bg-primary-500 h-3 rounded-full transition-all"
                      style={{ width: `${course.completionPercentage ?? 0}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Modules Completed
                  </span>
                  <span className="text-[14px] font-semibold text-neutral-900">
                    {course.modulesCompleted ?? 0} / {course.totalModules ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Time Spent
                  </span>
                  <span className="text-[14px] font-semibold text-neutral-900">
                    {course.timeSpent ?? '0m'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <h2 className="mb-4 text-[14px] font-semibold text-neutral-900">Actions</h2>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button fullWidth size="lg">
                  <PlayCircle className="h-4 w-4" />
                  Resume Course
                </Button>
                <Button variant="secondary" fullWidth>
                  <RotateCcw className="h-4 w-4" />
                  Retake Quiz
                </Button>
                <Button variant="secondary" fullWidth disabled>
                  <Download className="h-4 w-4" />
                  Download Certificate
                </Button>
                <Button variant="secondary" fullWidth>
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Complete (Admin)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Assigned To */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Assigned To</h2>
            </div>
            <CardContent>
              {assignedRoles.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {assignedRoles.map((role) => (
                    <div
                      key={role}
                      className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2"
                    >
                      <Shield className="h-3.5 w-3.5 text-neutral-400" />
                      <span className="text-[13px] font-medium text-neutral-700">{role}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[14px] text-neutral-400">No roles assigned.</p>
              )}
            </CardContent>
          </Card>

          {/* Related Courses */}
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-neutral-400" />
              <h2 className="text-[14px] font-semibold text-neutral-900">Related Courses</h2>
            </div>
            <CardContent>
              {relatedCourses.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {relatedCourses.map((related) => (
                    <Link
                      key={related.id}
                      href={`/training/${related.id}` as never}
                      className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 transition-colors hover:bg-neutral-100"
                    >
                      <p className="text-primary-600 text-[13px] font-medium">{related.title}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <Badge variant={getDifficultyVariant(related.difficulty)} size="sm">
                          {related.difficulty.charAt(0).toUpperCase() + related.difficulty.slice(1)}
                        </Badge>
                        <span className="text-[11px] text-neutral-400">{related.duration}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-[14px] text-neutral-400">No related courses.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
