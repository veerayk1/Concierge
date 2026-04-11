'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Brain, DollarSign, Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const AI_MODELS = [
  { id: 'claude-sonnet', label: 'Claude Sonnet 4', provider: 'Anthropic', recommended: true },
  { id: 'claude-haiku', label: 'Claude Haiku 4', provider: 'Anthropic', recommended: false },
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'OpenAI', recommended: false },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI', recommended: false },
];

const USAGE_STATS = [
  { label: 'Requests This Month', value: '0', change: '' },
  { label: 'Tokens Used', value: '0', change: '' },
  { label: 'Monthly Spend', value: '$0.00', change: '' },
  { label: 'Avg Response Time', value: '—', change: '' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AIConfigPage() {
  const [selectedModel, setSelectedModel] = useState('claude-sonnet');
  const [autoCategorize, setAutoCategorize] = useState(true);
  const [smartNotifications, setSmartNotifications] = useState(true);
  const [summarizeIncidents, setSummarizeIncidents] = useState(false);

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

      {/* Usage Stats */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Usage This Month
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {USAGE_STATS.map((stat) => (
            <Card key={stat.label} padding="sm">
              <p className="text-[12px] font-medium text-neutral-500">{stat.label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-[20px] font-bold text-neutral-900">{stat.value}</span>
                <span
                  className={`text-[12px] font-semibold ${
                    stat.change.startsWith('+')
                      ? 'text-success-600'
                      : stat.change.startsWith('-')
                        ? 'text-info-600'
                        : 'text-neutral-500'
                  }`}
                >
                  {stat.change}
                </span>
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
                    selectedModel === model.id
                      ? 'border-primary-300 bg-primary-50/50 ring-primary-100 ring-2'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="ai-model"
                    value={model.id}
                    checked={selectedModel === model.id}
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
            enabled={autoCategorize}
            onToggle={() => setAutoCategorize(!autoCategorize)}
          />
          <FeatureToggle
            icon={Zap}
            iconColor="text-warning-600"
            iconBg="bg-warning-50"
            title="Smart Notifications"
            description="AI determines notification urgency and batches non-critical notifications to reduce alert fatigue."
            enabled={smartNotifications}
            onToggle={() => setSmartNotifications(!smartNotifications)}
          />
          <FeatureToggle
            icon={Brain}
            iconColor="text-info-600"
            iconBg="bg-info-50"
            title="Incident Summarization"
            description="Generate concise summaries of incident reports for board members and property managers."
            enabled={summarizeIncidents}
            onToggle={() => setSummarizeIncidents(!summarizeIncidents)}
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
                defaultValue="100"
                helperText="AI features will be paused if the limit is reached. Set to 0 for unlimited."
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save */}
      <div className="flex justify-end pt-2">
        <Button size="lg">Save Changes</Button>
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
