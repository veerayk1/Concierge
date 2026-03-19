'use client';

import { use } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Download,
  Edit2,
  Eye,
  MessageSquare,
  Share2,
  Star,
  Trash2,
  User,
  XCircle,
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SurveyStatus = 'draft' | 'active' | 'closed' | 'archived';
type SurveyType = 'feedback' | 'poll' | 'satisfaction' | 'general';
type QuestionType = 'multiple_choice' | 'rating' | 'yes_no' | 'text';

interface ChoiceResult {
  label: string;
  count: number;
  percentage: number;
}

interface SurveyQuestion {
  id: string;
  text: string;
  type: QuestionType;
  choices?: ChoiceResult[];
  averageRating?: number;
  yesPercent?: number;
  noPercent?: number;
  yesCount?: number;
  noCount?: number;
  textResponses?: string[];
}

interface SurveyDetail {
  id: string;
  title: string;
  description: string;
  type: SurveyType;
  status: SurveyStatus;
  createdBy: string;
  createdAt: string;
  closesAt: string;
  anonymous: boolean;
  totalResponses: number;
  totalEligible: number;
  responseRate: number;
  completionRate: number;
  questions: SurveyQuestion[];
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const MOCK_SURVEY: SurveyDetail = {
  id: '1',
  title: 'Building Satisfaction Survey — Q1 2026',
  description:
    'Help us improve your living experience. This quarterly satisfaction survey covers building maintenance, amenities, communication, and overall management quality. Your feedback directly influences our priorities for the next quarter.',
  type: 'satisfaction',
  status: 'active',
  createdBy: 'Mike Johnson',
  createdAt: '2026-02-15T10:00:00',
  closesAt: '2026-04-01T23:59:59',
  anonymous: true,
  totalResponses: 45,
  totalEligible: 171,
  responseRate: 26.3,
  completionRate: 91.1,
  questions: [
    {
      id: 'q1',
      text: 'How would you rate the overall cleanliness and maintenance of common areas?',
      type: 'multiple_choice',
      choices: [
        { label: 'Excellent', count: 18, percentage: 40 },
        { label: 'Good', count: 15, percentage: 33.3 },
        { label: 'Average', count: 8, percentage: 17.8 },
        { label: 'Below Average', count: 3, percentage: 6.7 },
        { label: 'Poor', count: 1, percentage: 2.2 },
      ],
    },
    {
      id: 'q2',
      text: 'On a scale of 1-5, how satisfied are you with the building management team?',
      type: 'rating',
      averageRating: 4.2,
    },
    {
      id: 'q3',
      text: 'Would you recommend this building to a friend or family member?',
      type: 'yes_no',
      yesPercent: 78,
      noPercent: 22,
      yesCount: 35,
      noCount: 10,
    },
    {
      id: 'q4',
      text: 'What improvements would you most like to see in the next quarter?',
      type: 'text',
      textResponses: [
        'Better gym equipment, especially more free weights and a cable machine.',
        'The lobby could use more comfortable seating. The current chairs are outdated.',
        'Faster response times for maintenance requests. My last request took 5 days.',
        'Would love to see a dog wash station installed in the parking level.',
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  SurveyStatus,
  { variant: 'success' | 'error' | 'warning' | 'default' | 'info' | 'primary'; label: string }
> = {
  draft: { variant: 'default', label: 'Draft' },
  active: { variant: 'success', label: 'Active' },
  closed: { variant: 'warning', label: 'Closed' },
  archived: { variant: 'default', label: 'Archived' },
};

const TYPE_CONFIG: Record<
  SurveyType,
  { variant: 'primary' | 'info' | 'warning' | 'default'; label: string }
> = {
  feedback: { variant: 'primary', label: 'Feedback' },
  poll: { variant: 'info', label: 'Poll' },
  satisfaction: { variant: 'warning', label: 'Satisfaction' },
  general: { variant: 'default', label: 'General' },
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

  const survey = { ...MOCK_SURVEY, id };
  const statusCfg = STATUS_CONFIG[survey.status];
  const typeCfg = TYPE_CONFIG[survey.type];

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
                <div className="sm:col-span-2">
                  <InfoRow
                    label="Description"
                    value={<p className="leading-relaxed text-neutral-700">{survey.description}</p>}
                  />
                </div>
                <InfoRow
                  label="Type"
                  value={
                    <Badge variant={typeCfg.variant} size="lg">
                      {typeCfg.label}
                    </Badge>
                  }
                />
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
                      {survey.createdBy}
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
                <InfoRow
                  label="Closes At"
                  value={
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                      {new Date(survey.closesAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  }
                />
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
                    {survey.totalResponses}
                  </p>
                  <p className="text-[13px] text-neutral-500">of {survey.totalEligible} eligible</p>
                  <p className="mt-1 text-[12px] font-medium text-neutral-400">Total Responses</p>
                </div>
                <div className="flex flex-col items-center rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 text-center">
                  <p className="text-[32px] font-bold tracking-tight text-neutral-900">
                    {survey.responseRate}%
                  </p>
                  <div className="mt-2 h-2 w-full rounded-full bg-neutral-100">
                    <div
                      className="bg-primary-500 h-2 rounded-full"
                      style={{ width: `${survey.responseRate}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[12px] font-medium text-neutral-400">Response Rate</p>
                </div>
                <div className="flex flex-col items-center rounded-xl border border-neutral-100 bg-neutral-50/50 p-4 text-center">
                  <p className="text-[32px] font-bold tracking-tight text-neutral-900">
                    {survey.completionRate}%
                  </p>
                  <div className="mt-2 h-2 w-full rounded-full bg-neutral-100">
                    <div
                      className="bg-success-500 h-2 rounded-full"
                      style={{ width: `${survey.completionRate}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[12px] font-medium text-neutral-400">Completion Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-neutral-400" />
                <CardTitle>Results</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-8">
                {survey.questions.map((q, qi) => (
                  <div
                    key={q.id}
                    className="rounded-xl border border-neutral-100 bg-neutral-50/30 p-5"
                  >
                    <p className="text-[14px] font-semibold text-neutral-900">
                      {qi + 1}. {q.text}
                    </p>

                    {/* Multiple Choice — horizontal bar chart */}
                    {q.type === 'multiple_choice' && q.choices && (
                      <div className="mt-4 flex flex-col gap-2.5">
                        {q.choices.map((choice) => (
                          <div key={choice.label} className="flex items-center gap-3">
                            <span className="w-28 shrink-0 text-right text-[13px] text-neutral-600">
                              {choice.label}
                            </span>
                            <div className="h-6 flex-1 rounded-md bg-neutral-100">
                              <div
                                className="bg-primary-400 flex h-6 items-center rounded-md px-2"
                                style={{ width: `${Math.max(choice.percentage, 4)}%` }}
                              >
                                {choice.percentage >= 10 && (
                                  <span className="text-[11px] font-semibold text-white">
                                    {choice.count}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="w-12 text-[13px] font-medium text-neutral-700">
                              {choice.percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Rating — average with stars */}
                    {q.type === 'rating' && q.averageRating !== undefined && (
                      <div className="mt-4 flex items-center gap-4">
                        <p className="text-[36px] font-bold tracking-tight text-neutral-900">
                          {q.averageRating}
                        </p>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-5 w-5 ${
                                  i < Math.round(q.averageRating!)
                                    ? 'fill-warning-400 text-warning-400'
                                    : 'text-neutral-200'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-[12px] text-neutral-500">
                            out of 5.0 ({survey.totalResponses} ratings)
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Yes/No — pie-style display */}
                    {q.type === 'yes_no' && q.yesPercent !== undefined && (
                      <div className="mt-4 flex items-center gap-6">
                        <div className="flex items-center gap-3">
                          <div className="bg-success-50 flex h-14 w-14 items-center justify-center rounded-full">
                            <CheckCircle2 className="text-success-600 h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-success-700 text-[24px] font-bold">
                              {q.yesPercent}%
                            </p>
                            <p className="text-[12px] text-neutral-500">Yes ({q.yesCount})</p>
                          </div>
                        </div>
                        <div className="h-10 w-px bg-neutral-200" />
                        <div className="flex items-center gap-3">
                          <div className="bg-error-50 flex h-14 w-14 items-center justify-center rounded-full">
                            <XCircle className="text-error-600 h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-error-700 text-[24px] font-bold">{q.noPercent}%</p>
                            <p className="text-[12px] text-neutral-500">No ({q.noCount})</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Text responses */}
                    {q.type === 'text' && q.textResponses && (
                      <div className="mt-4 flex flex-col gap-2">
                        {q.textResponses.map((response, ri) => (
                          <div
                            key={ri}
                            className="rounded-lg border border-neutral-200 bg-white p-3"
                          >
                            <div className="flex items-start gap-2">
                              <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-300" />
                              <p className="text-[13px] leading-relaxed text-neutral-700">
                                {response}
                              </p>
                            </div>
                          </div>
                        ))}
                        <p className="mt-1 text-[12px] text-neutral-400">
                          Showing {q.textResponses.length} of {survey.totalResponses} responses
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
                <p className="text-[13px] text-neutral-500">
                  Closes{' '}
                  {new Date(survey.closesAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
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
                <Button fullWidth>
                  <XCircle className="h-4 w-4" />
                  Close Survey
                </Button>
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
                    {survey.questions.length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Responses
                  </span>
                  <span className="text-[15px] font-bold text-neutral-900">
                    {survey.totalResponses}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Response Rate
                  </span>
                  <span className="text-primary-600 text-[15px] font-bold">
                    {survey.responseRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-medium tracking-wide text-neutral-400 uppercase">
                    Completion
                  </span>
                  <span className="text-success-600 text-[15px] font-bold">
                    {survey.completionRate}%
                  </span>
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
