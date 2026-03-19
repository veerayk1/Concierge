'use client';

import { useState } from 'react';
import { PageShell } from '@/components/layout/page-shell';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Activity,
  Brain,
  Search,
  AlertTriangle,
  Wrench,
  Users,
  Tag,
  Zap,
  Settings,
  BarChart3,
  Clock,
  CheckCircle2,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AiFeature {
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'beta';
  metric: string;
  metricLabel: string;
  icon: typeof Activity;
  iconColor: string;
  iconBg: string;
}

interface AiAction {
  id: string;
  action: string;
  module: string;
  timestamp: string;
  model: string;
  status: 'completed' | 'pending' | 'failed';
}

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const AI_FEATURES: AiFeature[] = [
  {
    name: 'Daily Briefing',
    description: 'AI-generated shift summaries for front desk staff',
    status: 'active',
    metric: '45',
    metricLabel: 'briefings generated today',
    icon: MessageSquare,
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-50',
  },
  {
    name: 'Smart Search',
    description: 'Natural language search across all modules',
    status: 'active',
    metric: '1,234',
    metricLabel: 'queries processed',
    icon: Search,
    iconColor: 'text-info-600',
    iconBg: 'bg-info-50',
  },
  {
    name: 'Anomaly Detection',
    description: 'Detects unusual patterns in security and operations',
    status: 'active',
    metric: '2',
    metricLabel: 'alerts this week',
    icon: AlertTriangle,
    iconColor: 'text-warning-600',
    iconBg: 'bg-warning-50',
  },
  {
    name: 'Predictive Maintenance',
    description: 'Forecasts equipment failures before they happen',
    status: 'active',
    metric: '5',
    metricLabel: 'predictions this month',
    icon: Wrench,
    iconColor: 'text-error-600',
    iconBg: 'bg-error-50',
  },
  {
    name: 'Resident Insights',
    description: 'Satisfaction scoring and engagement analytics',
    status: 'active',
    metric: '87%',
    metricLabel: 'satisfaction predicted',
    icon: Users,
    iconColor: 'text-success-600',
    iconBg: 'bg-success-50',
  },
  {
    name: 'Auto-Categorization',
    description: 'Automatically tags and routes incoming requests',
    status: 'active',
    metric: '340',
    metricLabel: 'items categorized',
    icon: Tag,
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-50',
  },
];

const USAGE_METRICS = [
  { label: 'API Calls (Claude)', value: '12,450', change: '+8% vs last month' },
  { label: 'API Calls (OpenAI)', value: '3,280', change: '-2% vs last month' },
  { label: 'Total Cost', value: '$342.18', change: '+5% vs last month' },
  { label: 'Tokens Used', value: '4.2M', change: '+12% vs last month' },
];

const AI_CONFIG = {
  primaryModel: 'Claude Sonnet',
  fallbackModel: 'Claude Opus',
  temperature: 0.3,
  maxTokens: 4096,
  rateLimitPerMin: 60,
};

const QUALITY_METRICS = [
  { label: 'Accuracy Rate', value: '94.2%', target: '> 90%', status: 'good' as const },
  { label: 'False Positive Rate', value: '2.1%', target: '< 5%', status: 'good' as const },
  { label: 'User Satisfaction', value: '4.6 / 5.0', target: '> 4.0', status: 'good' as const },
  {
    label: 'Avg Response Time',
    value: '1.8s',
    target: '< 3s',
    status: 'good' as const,
  },
];

const RECENT_AI_ACTIONS: AiAction[] = [
  {
    id: 'AI-001',
    action: 'Generated daily briefing for morning shift',
    module: 'Daily Briefing',
    timestamp: '2026-03-19 08:00',
    model: 'Claude Sonnet',
    status: 'completed',
  },
  {
    id: 'AI-002',
    action: 'Detected unusual after-hours access pattern in Tower B',
    module: 'Anomaly Detection',
    timestamp: '2026-03-19 07:45',
    model: 'Claude Sonnet',
    status: 'completed',
  },
  {
    id: 'AI-003',
    action: 'Predicted HVAC unit #4 requires service within 14 days',
    module: 'Predictive Maintenance',
    timestamp: '2026-03-19 06:30',
    model: 'Claude Opus',
    status: 'completed',
  },
  {
    id: 'AI-004',
    action: 'Auto-categorized 23 maintenance requests',
    module: 'Auto-Categorization',
    timestamp: '2026-03-19 06:00',
    model: 'Claude Sonnet',
    status: 'completed',
  },
  {
    id: 'AI-005',
    action: 'Updated resident satisfaction scores for Q1',
    module: 'Resident Insights',
    timestamp: '2026-03-18 23:00',
    model: 'Claude Opus',
    status: 'completed',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AiDashboardPage() {
  const [selectedModel, setSelectedModel] = useState(AI_CONFIG.primaryModel);

  const statusBadge = {
    active: { variant: 'success' as const, label: 'Active' },
    inactive: { variant: 'default' as const, label: 'Inactive' },
    beta: { variant: 'info' as const, label: 'Beta' },
  };

  const actionStatusVariant = {
    completed: 'success' as const,
    pending: 'warning' as const,
    failed: 'error' as const,
  };

  return (
    <PageShell
      title="AI Dashboard"
      description="Monitor AI-powered features and analytics."
      actions={
        <Button variant="secondary" size="sm">
          <Settings className="h-4 w-4" />
          AI Settings
        </Button>
      }
    >
      {/* AI Features Status */}
      <div>
        <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">AI Features</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AI_FEATURES.map((feature) => {
            const Icon = feature.icon;
            const badge = statusBadge[feature.status];
            return (
              <Card key={feature.name} padding="md" hoverable>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${feature.iconBg}`}
                    >
                      <Icon className={`h-5 w-5 ${feature.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-semibold text-neutral-900">{feature.name}</h3>
                      <p className="text-[12px] text-neutral-500">{feature.description}</p>
                    </div>
                  </div>
                  <Badge variant={badge.variant} size="sm" dot>
                    {badge.label}
                  </Badge>
                </div>
                <div className="mt-4 flex items-baseline gap-2 border-t border-neutral-100 pt-3">
                  <span className="text-[22px] font-bold text-neutral-900">{feature.metric}</span>
                  <span className="text-[12px] text-neutral-500">{feature.metricLabel}</span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Usage Metrics */}
      <div className="mt-8">
        <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">Usage Metrics</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {USAGE_METRICS.map((metric) => (
            <Card key={metric.label} padding="md">
              <p className="text-[13px] text-neutral-500">{metric.label}</p>
              <p className="mt-1 text-[24px] font-bold tracking-tight text-neutral-900">
                {metric.value}
              </p>
              <p className="mt-1 text-[12px] text-neutral-400">{metric.change}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* AI Configuration + Quality Metrics side by side */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* AI Configuration */}
        <div>
          <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">AI Configuration</h2>
          <Card padding="md">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-neutral-500">Primary Model</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="focus:border-primary-300 focus:ring-primary-100 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[13px] font-medium text-neutral-900 focus:ring-2 focus:outline-none"
                >
                  <option>Claude Sonnet</option>
                  <option>Claude Opus</option>
                </select>
              </div>
              <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                <span className="text-[13px] text-neutral-500">Fallback Model</span>
                <span className="text-[13px] font-medium text-neutral-900">
                  {AI_CONFIG.fallbackModel}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                <span className="text-[13px] text-neutral-500">Temperature</span>
                <span className="text-[13px] font-medium text-neutral-900">
                  {AI_CONFIG.temperature}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                <span className="text-[13px] text-neutral-500">Max Tokens</span>
                <span className="text-[13px] font-medium text-neutral-900">
                  {AI_CONFIG.maxTokens.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                <span className="text-[13px] text-neutral-500">Rate Limit</span>
                <span className="text-[13px] font-medium text-neutral-900">
                  {AI_CONFIG.rateLimitPerMin} req/min
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Quality Metrics */}
        <div>
          <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">Quality Metrics</h2>
          <Card padding="md">
            <div className="space-y-4">
              {QUALITY_METRICS.map((metric, idx) => (
                <div
                  key={metric.label}
                  className={`flex items-center justify-between ${idx > 0 ? 'border-t border-neutral-100 pt-4' : ''}`}
                >
                  <div>
                    <p className="text-[13px] font-medium text-neutral-900">{metric.label}</p>
                    <p className="text-[12px] text-neutral-400">Target: {metric.target}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-bold text-neutral-900">{metric.value}</span>
                    <CheckCircle2 className="text-success-500 h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent AI Actions */}
      <div className="mt-8">
        <h2 className="mb-4 text-[16px] font-semibold text-neutral-900">Recent AI Actions</h2>
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="px-6 py-3 text-left text-[12px] font-semibold tracking-wider text-neutral-400 uppercase">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-[12px] font-semibold tracking-wider text-neutral-400 uppercase">
                    Module
                  </th>
                  <th className="px-6 py-3 text-left text-[12px] font-semibold tracking-wider text-neutral-400 uppercase">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-[12px] font-semibold tracking-wider text-neutral-400 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-[12px] font-semibold tracking-wider text-neutral-400 uppercase">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {RECENT_AI_ACTIONS.map((action) => (
                  <tr key={action.id} className="hover:bg-neutral-25 transition-colors">
                    <td className="px-6 py-4 text-[13px] text-neutral-700">{action.action}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="default" size="sm">
                        {action.module}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-[13px] whitespace-nowrap text-neutral-500">
                      {action.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={actionStatusVariant[action.status]} size="sm" dot>
                        {action.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-[13px] whitespace-nowrap text-neutral-500">
                      {action.timestamp}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
