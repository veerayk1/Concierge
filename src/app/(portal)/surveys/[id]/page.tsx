'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Download,
  Edit2,
  Eye,
  Loader2,
  MessageSquare,
  Share2,
  Star,
  Trash2,
  User,
  XCircle,
} from 'lucide-react';
import { useApi } from '@/lib/hooks/use-api';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SurveyStatus = 'draft' | 'active' | 'closed' | 'archived';

interface ApiSurveyDetail {
  id: string;
  title: string;
  description: string | null;
  status: string;
  anonymous: boolean;
  responseCount: number;
  expiryDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: string | null;
  visibleToOwners: boolean;
  visibleToTenants: boolean;
  questionCount: number;
  questions: Array<{
    id: string;
    questionText: string;
    questionType: string;
    isRequired: boolean;
    options: unknown;
    config: unknown;
    sortOrder: number;
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  string,
  { variant: 'success' | 'error' | 'warning' | 'default' | 'info' | 'primary'; label: string }
> = {
  draft: { variant: 'default', label: 'Draft' },
  active: { variant: 'success', label: 'Active' },
  closed: { variant: 'warning', label: 'Closed' },
  archived: { variant: 'default', label: 'Archived' },
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">{label}</p>
      <div className="mt-1 text-[14px] text-neutral-900">{value}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface SurveyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function SurveyDetailPage({ params }: SurveyDetailPageProps) {
  const { id } = use(params);

  const {
    data: survey,
    loading,
    error,
    refetch,
  } = useApi<ApiSurveyDetail>(`/api/v1/surveys/${id}`);

  // Loading
  if (loading) {
    return (
      <PageShell title="Survey" description="Loading...">
        <div className="-mt-4 mb-4">
          <Link
            href="/surveys"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to surveys
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="mt-3 text-[14px] text-neutral-500">Loading survey details...</p>
        </div>
      </PageShell>
    );
  }

  // Error
  if (error || !survey) {
    return (
      <PageShell title="Survey" description="Error">
        <div className="-mt-4 mb-4">
          <Link
            href="/surveys"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to surveys
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-12">
          <AlertTriangle className="text-error-500 h-8 w-8" />
          <p className="mt-3 text-[14px] font-medium text-neutral-900">Failed to load survey</p>
          <p className="mt-1 text-[13px] text-neutral-500">{error ?? 'Survey not found'}</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      </PageShell>
    );
  }

  const statusCfg = STATUS_CONFIG[survey.status] ?? STATUS_CONFIG.draft;
  const totalEligible = 171; // Default eligible count; would come from property in production
  const responseRate =
    totalEligible > 0 ? Math.round((survey.responseCount / totalEligible) * 100 * 10) / 10 : 0;

  return (
    <PageShell
      title={survey.title}
      description="Survey Results"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm">
            <Edit2 className="h-4 w-4" />
            Edit
          </Button>
        </div>
      }
    >
      {/* Back link */}
      <div className="-mt-4 mb-4">
        <Link
          href="/surveys"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to surveys
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* ---- Left Column ---- */}
        <div className="flex flex-col gap-6 xl:col-span-2">
          {/* Survey Info */}
          <Card>
            <CardHeader>
              <CardTitle>Survey Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <InfoRow label="Title" value={survey.title} />
                </div>
                {survey.description && (
                  <div className="sm:col-span-2">
                    <InfoRow
                      label="Description"
                      value={
                        <p className="leading-relaxed text-neutral-700">{survey.description}</p>
                      }
                    />
                  </div>
                )}
                <InfoRow
                  label="Status"
                  value={
                    <Badge variant={statusCfg.variant} size="lg" dot>
                      {statusCfg.label}
                    </Badge>
                  }
                />
                <InfoRow
                  label="Created By"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-neutral-400" />
                      {survey.createdById ?? 'System'}
                    </span>
                  }
                />
                <InfoRow
                  label="Created At"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      {new Date(survey.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  }
                />
                {survey.expiryDate && (
                  <InfoRow
                    label="Closes At"
                    value={
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                        {new Date(survey.expiryDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    }
                  />
                )}
                <InfoRow
                  label="Anonymous"
                  value={
                    <Badge variant={survey.anonymous ? 'info' : 'default'} size="lg" dot>
                      {survey.anonymous ? 'Yes' : 'No'}
                    </Badge>
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Response Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Response Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div className="flex flex-col items-center rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 text-center">
                  <p className="text-[32px] font-bold tracking-tight text-neutral-900">
                    {survey.responseCount}
                  </p>
                  <p className="text-[13px] text-neutral-500">of {totalEligible} eligible</p>
                  <p className="mt-1 text-[12px] font-medium text-neutral-400">Total Responses</p>
                </div>
                <div className="flex flex-col items-center rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 text-center">
                  <p className="text-[32px] font-bold tracking-tight text-neutral-900">
                    {responseRate}%
                  </p>
                  <div className="mt-2 h-2 w-full rounded-full bg-neutral-100">
                    <div
                      className="bg-primary-500 h-2 rounded-full"
                      style={{ width: `${Math.min(responseRate, 100)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[12px] font-medium text-neutral-400">Response Rate</p>
                </div>
                <div className="flex flex-col items-center rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 text-center">
                  <p className="text-[32px] font-bold tracking-tight text-neutral-900">
                    {survey.questionCount}
                  </p>
                  <p className="mt-1 text-[12px] font-medium text-neutral-400">Questions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Questions */}
          {survey.questions.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-neutral-400" />
                  <CardTitle>Questions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  {survey.questions.map((q, qi) => (
                    <div
                      key={q.id}
                      className="rounded-xl border border-neutral-100 bg-neutral-50/30 p-5"
                    >
                      <p className="text-[14px] font-semibold text-neutral-900">
                        {qi + 1}. {q.questionText}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="default" size="sm">
                          {q.questionType.replace('_', ' ')}
                        </Badge>
                        {q.isRequired && (
                          <Badge variant="error" size="sm">
                            Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ---- Right Column ---- */}
        <div className="flex flex-col gap-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-3 text-center">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
                    statusCfg.variant === 'success'
                      ? 'bg-success-50'
                      : statusCfg.variant === 'warning'
                        ? 'bg-warning-50'
                        : 'bg-neutral-100'
                  }`}
                >
                  <ClipboardList
                    className={`h-8 w-8 ${
                      statusCfg.variant === 'success'
                        ? 'text-success-600'
                        : statusCfg.variant === 'warning'
                          ? 'text-warning-600'
                          : 'text-neutral-400'
                    }`}
                  />
                </div>
                <Badge variant={statusCfg.variant} size="lg" dot>
                  {statusCfg.label}
                </Badge>
                {survey.expiryDate && (
                  <p className="text-[13px] text-neutral-500">
                    Closes{' '}
                    {new Date(survey.expiryDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {survey.status === 'active' && (
                  <Button fullWidth>
                    <XCircle className="h-4 w-4" />
                    Close Survey
                  </Button>
                )}
                <Button variant="secondary" fullWidth>
                  <Download className="h-4 w-4" />
                  Export Results (CSV)
                </Button>
                <Button variant="secondary" fullWidth>
                  <Share2 className="h-4 w-4" />
                  Share Results
                </Button>
                <Button variant="secondary" fullWidth>
                  <Eye className="h-4 w-4" />
                  Preview Survey
                </Button>
                <Button variant="danger" fullWidth>
                  <Trash2 className="h-4 w-4" />
                  Delete Survey
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Questions
                  </span>
                  <span className="text-[15px] font-bold text-neutral-900">
                    {survey.questionCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Responses
                  </span>
                  <span className="text-[15px] font-bold text-neutral-900">
                    {survey.responseCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Response Rate
                  </span>
                  <span className="text-primary-600 text-[15px] font-bold">{responseRate}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Anonymous
                  </span>
                  <Badge variant={survey.anonymous ? 'info' : 'default'} size="md">
                    {survey.anonymous ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
