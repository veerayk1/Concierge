'use client';

import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useApi, apiUrl } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import {
  Activity,
  Brain,
  AlertTriangle,
  Wrench,
  TrendingUp,
  TrendingDown,
  Minus,
  Settings,
  BarChart3,
  CheckCircle2,
  Loader2,
  Package,
  Clock,
  Shield,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types matching /api/v1/ai/analytics response
// ---------------------------------------------------------------------------

interface Factor {
  name: string;
  score: number;
  weight: number;
}

interface DeliveryTrend {
  period: string;
  count: number;
  avgDeliveryHours: number;
}

interface AiAnalyticsData {
  healthScore: number;
  trend: 'up' | 'down' | 'flat';
  factors: Factor[];
  packageDeliveryTrend: DeliveryTrend[];
  maintenanceSlaCompliance: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-success-600';
  if (score >= 60) return 'text-warning-600';
  return 'text-error-600';
}

function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-success-50';
  if (score >= 60) return 'bg-warning-50';
  return 'bg-error-50';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Needs Attention';
}

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'flat' }) => {
  if (trend === 'up') return <TrendingUp className="text-success-600 h-4 w-4" />;
  if (trend === 'down') return <TrendingDown className="text-error-600 h-4 w-4" />;
  return <Minus className="h-4 w-4 text-neutral-400" />;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AiDashboardPage() {
  const {
    data: analytics,
    loading,
    error,
    refetch,
  } = useApi<AiAnalyticsData>(apiUrl('/api/v1/ai/analytics', { propertyId: getPropertyId() }));

  return (
    <PageShell
      title="AI Dashboard"
      description="AI-powered building analytics and operational insights."
      actions={
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          <Settings className="h-4 w-4" />
          Refresh Analytics
        </Button>
      }
    >
      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="text-primary-500 h-8 w-8 animate-spin" />
          <p className="mt-3 text-[14px] text-neutral-500">Calculating AI analytics...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load AI analytics"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      )}

      {/* Data Loaded */}
      {!loading && !error && analytics && (
        <>
          {/* Health Score Hero */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card padding="md" className="lg:col-span-1">
              <div className="flex flex-col items-center py-4">
                <p className="mb-2 text-[13px] font-medium text-neutral-500">
                  Building Health Score
                </p>
                <div
                  className={`flex h-28 w-28 items-center justify-center rounded-full ${getScoreBg(analytics.healthScore)}`}
                >
                  <span className={`text-[42px] font-bold ${getScoreColor(analytics.healthScore)}`}>
                    {analytics.healthScore}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <TrendIcon trend={analytics.trend} />
                  <span className="text-[13px] text-neutral-500">
                    {analytics.trend === 'up'
                      ? 'Improving'
                      : analytics.trend === 'down'
                        ? 'Declining'
                        : 'Stable'}
                  </span>
                </div>
                <Badge
                  variant={
                    analytics.healthScore >= 80
                      ? 'success'
                      : analytics.healthScore >= 60
                        ? 'warning'
                        : 'error'
                  }
                  size="sm"
                  className="mt-2"
                >
                  {getScoreLabel(analytics.healthScore)}
                </Badge>
              </div>
            </Card>

            {/* Score Factors */}
            <Card padding="md" className="lg:col-span-2">
              <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">
                Health Score Factors
              </h2>
              <div className="space-y-4">
                {analytics.factors.map((factor) => {
                  const weighted = Math.round(factor.score * factor.weight);
                  return (
                    <div key={factor.name}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[14px] font-medium text-neutral-700">
                          {factor.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-[12px] text-neutral-400">
                            Weight: {Math.round(factor.weight * 100)}%
                          </span>
                          <span className={`text-[14px] font-bold ${getScoreColor(factor.score)}`}>
                            {factor.score}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            factor.score >= 80
                              ? 'bg-success-500'
                              : factor.score >= 60
                                ? 'bg-warning-500'
                                : 'bg-error-500'
                          }`}
                          style={{ width: `${factor.score}%` }}
                        />
                      </div>
                      <p className="mt-0.5 text-[12px] text-neutral-400">
                        Contributes {weighted} points to overall score
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* SLA + Delivery Trend */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Maintenance SLA */}
            <Card padding="md">
              <div className="flex items-center gap-3">
                <div className="bg-primary-50 flex h-10 w-10 items-center justify-center rounded-xl">
                  <Wrench className="text-primary-600 h-5 w-5" />
                </div>
                <div>
                  <p className="text-[13px] text-neutral-500">Maintenance SLA Compliance</p>
                  <p className="text-[28px] font-bold tracking-tight text-neutral-900">
                    {analytics.maintenanceSlaCompliance}%
                  </p>
                </div>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    analytics.maintenanceSlaCompliance >= 80
                      ? 'bg-success-500'
                      : analytics.maintenanceSlaCompliance >= 60
                        ? 'bg-warning-500'
                        : 'bg-error-500'
                  }`}
                  style={{ width: `${analytics.maintenanceSlaCompliance}%` }}
                />
              </div>
              <p className="mt-2 text-[12px] text-neutral-400">
                Percentage of maintenance requests resolved within 72-hour SLA over the last 90 days
              </p>
            </Card>

            {/* Package Delivery Trend */}
            <Card padding="md">
              <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">
                Package Delivery Trend (Last 4 Weeks)
              </h2>
              {analytics.packageDeliveryTrend.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Package className="mb-2 h-8 w-8 text-neutral-300" />
                  <p className="text-[14px] text-neutral-400">No package data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analytics.packageDeliveryTrend.map((week) => (
                    <div
                      key={week.period}
                      className="flex items-center justify-between rounded-lg border border-neutral-100 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-info-50 flex h-8 w-8 items-center justify-center rounded-lg">
                          <Package className="text-info-600 h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-neutral-900">
                            {week.period.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </p>
                          <p className="text-[12px] text-neutral-400">
                            {week.count} package{week.count !== 1 ? 's' : ''} processed
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-semibold text-neutral-900">
                          {week.avgDeliveryHours}h
                        </p>
                        <p className="text-[11px] text-neutral-400">avg release time</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* AI Features Info (static — these represent available AI capabilities) */}
          <div className="mt-8">
            <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">
              AI-Powered Capabilities
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: 'Building Health Score',
                  description:
                    'Weighted score from maintenance backlog, package handling, SLA compliance, and open issues',
                  icon: Activity,
                  iconColor: 'text-primary-600',
                  iconBg: 'bg-primary-50',
                  active: true,
                },
                {
                  name: 'Package Delivery Analytics',
                  description: 'Tracks average package release times and weekly delivery trends',
                  icon: Package,
                  iconColor: 'text-info-600',
                  iconBg: 'bg-info-50',
                  active: true,
                },
                {
                  name: 'Maintenance SLA Tracking',
                  description: 'Monitors 72-hour SLA compliance across all maintenance requests',
                  icon: Wrench,
                  iconColor: 'text-warning-600',
                  iconBg: 'bg-warning-50',
                  active: true,
                },
                {
                  name: 'Trend Analysis',
                  description:
                    'Compares current health score against historical scores to detect trends',
                  icon: BarChart3,
                  iconColor: 'text-success-600',
                  iconBg: 'bg-success-50',
                  active: true,
                },
                {
                  name: 'Anomaly Detection',
                  description: 'Detects unusual patterns in security events and operational data',
                  icon: Shield,
                  iconColor: 'text-error-600',
                  iconBg: 'bg-error-50',
                  active: false,
                },
                {
                  name: 'Predictive Maintenance',
                  description:
                    'Forecasts equipment failures before they happen based on historical data',
                  icon: Clock,
                  iconColor: 'text-neutral-600',
                  iconBg: 'bg-neutral-50',
                  active: false,
                },
              ].map((feature) => {
                const Icon = feature.icon;
                return (
                  <Card key={feature.name} padding="md">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${feature.iconBg}`}
                      >
                        <Icon className={`h-5 w-5 ${feature.iconColor}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-[14px] font-semibold text-neutral-900">
                            {feature.name}
                          </h3>
                          <Badge variant={feature.active ? 'success' : 'default'} size="sm" dot>
                            {feature.active ? 'Active' : 'Coming Soon'}
                          </Badge>
                        </div>
                        <p className="mt-1 text-[12px] leading-relaxed text-neutral-500">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* No data but no error (unlikely but handle gracefully) */}
      {!loading && !error && !analytics && (
        <EmptyState
          icon={<Brain className="h-6 w-6" />}
          title="No analytics data"
          description="AI analytics will appear here once there is operational data for this property."
        />
      )}
    </PageShell>
  );
}
