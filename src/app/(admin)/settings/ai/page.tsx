'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Brain,
  Check,
  DollarSign,
  Loader2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';

// ---------------------------------------------------------------------------
// Static Data
// ---------------------------------------------------------------------------

const AI_MODELS = [
  { id: 'claude-sonnet', label: 'Claude Sonnet 4', provider: 'Anthropic', recommended: true },
  { id: 'claude-haiku', label: 'Claude Haiku 4', provider: 'Anthropic', recommended: false },
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI', recommended: false },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI', recommended: false },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AiConfig {
  selectedModel: string;
  autoCategorize: boolean;
  smartNotifications: boolean;
  summarizeIncidents: boolean;
  monthlySpendLimit: number;
}

interface SettingsApiData {
  property: {
    id: string;
    name: string;
    branding: unknown;
  };
  eventTypes: unknown[];
}

interface AnalyticsData {
  healthScore: number | null;
  trend: string;
  factors: Array<{ name: string; score: number; weight: number }>;
  packageDeliveryTrend: Array<{ period: string; count: number; avgDeliveryHours: number }>;
  maintenanceSlaCompliance: number | null;
}

const DEFAULT_AI_CONFIG: AiConfig = {
  selectedModel: 'claude-sonnet',
  autoCategorize: true,
  smartNotifications: true,
  summarizeIncidents: false,
  monthlySpendLimit: 100,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AIConfigPage() {
  const propertyId = getPropertyId();

  // Load current settings from the property settings API
  const {
    data: settingsData,
    loading: settingsLoading,
    error: settingsError,
    refetch,
  } = useApi<SettingsApiData>(apiUrl('/api/v1/settings', { propertyId }));

  // Load analytics data for usage stats
  const { data: analytics, loading: analyticsLoading } = useApi<AnalyticsData>(
    apiUrl('/api/v1/ai/analytics', { propertyId }),
  );

  // Local state initialized from API data
  const savedConfig = useMemo<AiConfig>(() => {
    if (!settingsData?.property?.branding) return DEFAULT_AI_CONFIG;
    const branding = settingsData.property.branding as Record<string, unknown>;
    const ai = branding?.aiConfig as Partial<AiConfig> | undefined;
    if (!ai) return DEFAULT_AI_CONFIG;
    return { ...DEFAULT_AI_CONFIG, ...ai };
  }, [settingsData]);

  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [autoCategorize, setAutoCategorize] = useState<boolean | null>(null);
  const [smartNotifications, setSmartNotifications] = useState<boolean | null>(null);
  const [summarizeIncidents, setSummarizeIncidents] = useState<boolean | null>(null);
  const [monthlySpendLimit, setMonthlySpendLimit] = useState<string | null>(null);

  // Use local overrides if set, otherwise use saved config
  const currentModel = selectedModel ?? savedConfig.selectedModel;
  const currentAutoCategorize = autoCategorize ?? savedConfig.autoCategorize;
  const currentSmartNotifications = smartNotifications ?? savedConfig.smartNotifications;
  const currentSummarizeIncidents = summarizeIncidents ?? savedConfig.summarizeIncidents;
  const currentSpendLimit = monthlySpendLimit ?? String(savedConfig.monthlySpendLimit);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Build usage stats from analytics
  const usageStats = useMemo(() => {
    if (!analytics || analytics.healthScore === null) {
      return [
        { label: 'Health Score', value: '--', change: '' },
        { label: 'Maintenance SLA', value: '--', change: '' },
        { label: 'Packages (30d)', value: '--', change: '' },
        { label: 'Trend', value: '--', change: '' },
      ];
    }
    const totalPackages = analytics.packageDeliveryTrend.reduce((sum, w) => sum + w.count, 0);
    return [
      {
        label: 'Health Score',
        value: `${analytics.healthScore}/100`,
        change:
          analytics.trend === 'up' ? '+improving' : analytics.trend === 'down' ? '-declining' : '',
      },
      {
        label: 'Maintenance SLA',
        value:
          analytics.maintenanceSlaCompliance !== null
            ? `${analytics.maintenanceSlaCompliance}%`
            : '--',
        change: '',
      },
      {
        label: 'Packages (30d)',
        value: String(totalPackages),
        change: '',
      },
      {
        label: 'Trend',
        value:
          analytics.trend === 'up'
            ? 'Improving'
            : analytics.trend === 'down'
              ? 'Declining'
              : 'Stable',
        change: '',
      },
    ];
  }, [analytics]);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const aiConfig: AiConfig = {
      selectedModel: currentModel,
      autoCategorize: currentAutoCategorize,
      smartNotifications: currentSmartNotifications,
      summarizeIncidents: currentSummarizeIncidents,
      monthlySpendLimit: Number(currentSpendLimit) || 0,
    };

    // Store AI config inside the branding JSON field on the Property model
    const existingBranding =
      settingsData?.property?.branding && typeof settingsData.property.branding === 'object'
        ? (settingsData.property.branding as Record<string, unknown>)
        : {};

    const body = {
      propertyId,
      branding: { ...existingBranding, aiConfig },
    };

    try {
      const res = await apiRequest('/api/v1/settings', { method: 'PATCH', body });
      const result = await res.json();

      if (!res.ok) {
        setSaveError(result.message || 'Failed to save AI configuration');
        return;
      }

      setSaveSuccess(true);
      refetch();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Loading State
  // ---------------------------------------------------------------------------

  if (settingsLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 py-8">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[200px] rounded-2xl" />
        <Skeleton className="h-[300px] rounded-2xl" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error State
  // ---------------------------------------------------------------------------

  if (settingsError) {
    return (
      <div className="mx-auto max-w-3xl py-8">
        <EmptyState
          icon={<AlertCircle className="h-6 w-6" />}
          title="Failed to load AI settings"
          description={settingsError}
          action={
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          }
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-8">
      {/* Back Navigation */}
      <Link
        href="/settings"
        className="inline-flex items-center gap-2 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">AI Configuration</h1>
        <p className="mt-1 text-[14px] text-neutral-500">
          Configure AI features, model selection, and automation settings.
        </p>
      </div>

      {/* Usage / Analytics Stats */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Building Analytics
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {usageStats.map((stat) => (
            <Card key={stat.label} padding="sm">
              <p className="text-[12px] font-medium text-neutral-500">{stat.label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-[20px] font-bold text-neutral-900">
                  {analyticsLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-neutral-300" />
                  ) : (
                    stat.value
                  )}
                </span>
                {stat.change && (
                  <span
                    className={`text-[12px] font-semibold ${
                      stat.change.startsWith('+')
                        ? 'text-success-600'
                        : stat.change.startsWith('-')
                          ? 'text-warning-600'
                          : 'text-neutral-500'
                    }`}
                  >
                    {stat.change}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Model Selection */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Model Selection
        </h2>
        <Card>
          <CardContent>
            <div className="mb-3 flex items-center gap-3">
              <div className="bg-info-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <Brain className="text-info-600 h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-neutral-900">Primary AI Model</h3>
                <p className="text-[13px] text-neutral-500">
                  Select the model used for categorization, summarization, and smart features.
                </p>
              </div>
            </div>
            <div className="space-y-2 pl-[52px]">
              {AI_MODELS.map((model) => (
                <label
                  key={model.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                    currentModel === model.id
                      ? 'border-primary-300 bg-primary-50/50 ring-primary-100 ring-2'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="ai-model"
                    value={model.id}
                    checked={currentModel === model.id}
                    onChange={() => setSelectedModel(model.id)}
                    className="text-primary-500 focus:ring-primary-100 h-4 w-4"
                  />
                  <div className="flex-1">
                    <span className="text-[14px] font-medium text-neutral-900">{model.label}</span>
                    <span className="ml-2 text-[12px] text-neutral-400">{model.provider}</span>
                  </div>
                  {model.recommended && (
                    <Badge variant="success" size="sm">
                      Recommended
                    </Badge>
                  )}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Features */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          AI Features
        </h2>
        <div className="space-y-3">
          <FeatureToggle
            icon={Sparkles}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
            title="Auto-Categorization"
            description="Automatically categorize incoming events, maintenance requests, and incidents using AI."
            enabled={currentAutoCategorize}
            onToggle={() => setAutoCategorize(!currentAutoCategorize)}
          />
          <FeatureToggle
            icon={Zap}
            iconColor="text-warning-600"
            iconBg="bg-warning-50"
            title="Smart Notifications"
            description="AI determines notification urgency and batches non-critical notifications to reduce alert fatigue."
            enabled={currentSmartNotifications}
            onToggle={() => setSmartNotifications(!currentSmartNotifications)}
          />
          <FeatureToggle
            icon={Brain}
            iconColor="text-info-600"
            iconBg="bg-info-50"
            title="Incident Summarization"
            description="Generate concise summaries of incident reports for board members and property managers."
            enabled={currentSummarizeIncidents}
            onToggle={() => setSummarizeIncidents(!currentSummarizeIncidents)}
          />
        </div>
      </div>

      {/* Spend Limit */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Budget Controls
        </h2>
        <Card>
          <CardContent>
            <div className="mb-4 flex items-center gap-3">
              <div className="bg-success-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <DollarSign className="text-success-600 h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-neutral-900">Monthly Spend Limit</h3>
                <p className="text-[13px] text-neutral-500">
                  Set a maximum monthly budget for AI usage. You will be notified at 80% usage.
                </p>
              </div>
            </div>
            <div className="pl-[52px]">
              <Input
                label="Monthly Limit (USD)"
                type="number"
                value={currentSpendLimit}
                onChange={(e) => setMonthlySpendLimit(e.target.value)}
                helperText="AI features will be paused if the limit is reached. Set to 0 for unlimited."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Feedback */}
      {saveError && (
        <div className="border-error-200 bg-error-50/40 text-error-700 flex items-center gap-2 rounded-xl border px-4 py-3 text-[13px]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {saveError}
        </div>
      )}

      {saveSuccess && (
        <div className="border-success-200 bg-success-50/40 text-success-700 flex items-center gap-2 rounded-xl border px-4 py-3 text-[13px]">
          <Check className="h-4 w-4 shrink-0" />
          AI configuration saved successfully.
        </div>
      )}

      {/* Save */}
      <div className="flex justify-end pt-2">
        <Button size="lg" onClick={handleSave} loading={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feature Toggle Sub-Component
// ---------------------------------------------------------------------------

function FeatureToggle({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  description,
  enabled,
  onToggle,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}
          >
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-[15px] font-semibold text-neutral-900">{title}</h3>
            <p className="mt-0.5 text-[13px] text-neutral-500">{description}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={onToggle}
            className={`focus:ring-primary-100 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-4 focus:outline-none ${
              enabled ? 'bg-primary-500' : 'bg-neutral-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
