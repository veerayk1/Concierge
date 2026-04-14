'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  Mail,
  Megaphone,
  Package,
  ShieldCheck,
  Calendar,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmailModuleConfig {
  id: string;
  module: string;
  moduleKey: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  fromAddress: string;
  fromName: string;
  replyToAddress: string;
}

// ---------------------------------------------------------------------------
// Module definitions (visual config only — data comes from API)
// ---------------------------------------------------------------------------

const MODULE_DEFS = [
  {
    moduleKey: 'general',
    module: 'General',
    icon: Mail,
    iconColor: 'text-neutral-600',
    iconBg: 'bg-neutral-100',
  },
  {
    moduleKey: 'security',
    module: 'Security',
    icon: ShieldCheck,
    iconColor: 'text-error-600',
    iconBg: 'bg-error-50',
  },
  {
    moduleKey: 'maintenance',
    module: 'Maintenance',
    icon: Wrench,
    iconColor: 'text-warning-600',
    iconBg: 'bg-warning-50',
  },
  {
    moduleKey: 'packages',
    module: 'Packages',
    icon: Package,
    iconColor: 'text-info-600',
    iconBg: 'bg-info-50',
  },
  {
    moduleKey: 'amenities',
    module: 'Amenities',
    icon: Calendar,
    iconColor: 'text-primary-600',
    iconBg: 'bg-primary-50',
  },
  {
    moduleKey: 'announcements',
    module: 'Announcements',
    icon: Megaphone,
    iconColor: 'text-success-600',
    iconBg: 'bg-success-50',
  },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function EmailConfigurationPage() {
  const propertyId = getPropertyId();

  // Fetch existing email configs from API
  const {
    data: apiResponse,
    loading,
    error,
    refetch,
  } = useApi<{ propertyId: string; configs: any[] }>(
    apiUrl('/api/v1/settings/email-config', { propertyId }),
  );

  // Module form state — keyed by moduleKey
  const [moduleFormData, setModuleFormData] = useState<
    Record<string, { fromAddress: string; fromName: string; replyToAddress: string }>
  >({});

  // Global settings state
  const [globalCc, setGlobalCc] = useState('');
  const [emailSignature, setEmailSignature] = useState('');
  const [deliveryFailureTracking, setDeliveryFailureTracking] = useState(true);

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Populate form state from API data
  useEffect(() => {
    if (!apiResponse) return;
    const configs = apiResponse.configs ?? (Array.isArray(apiResponse) ? apiResponse : []);
    const formData: Record<
      string,
      { fromAddress: string; fromName: string; replyToAddress: string }
    > = {};
    for (const def of MODULE_DEFS) {
      const existing = configs.find((c: any) => c.moduleKey === def.moduleKey);
      formData[def.moduleKey] = {
        fromAddress: existing?.fromEmail ?? '',
        fromName: existing?.fromName ?? '',
        replyToAddress: existing?.replyTo ?? '',
      };
    }
    setModuleFormData(formData);
  }, [apiResponse]);

  // Update a single module field
  const updateModuleField = useCallback(
    (moduleKey: string, field: 'fromAddress' | 'fromName' | 'replyToAddress', value: string) => {
      setModuleFormData((prev) => {
        const current = prev[moduleKey] ?? { fromAddress: '', fromName: '', replyToAddress: '' };
        return {
          ...prev,
          [moduleKey]: {
            ...current,
            [field]: value,
          },
        };
      });
    },
    [],
  );

  // Clear save message after timeout
  const showSaveMessage = useCallback((type: 'success' | 'error', text: string) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveMessage({ type, text });
    saveTimeoutRef.current = setTimeout(() => setSaveMessage(null), 5000);
  }, []);

  // Save all module configs
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      // Save each module that has at least a fromAddress and fromName
      const savePromises = MODULE_DEFS.map(async (def) => {
        const data = moduleFormData[def.moduleKey];
        if (!data) return;

        // Only save modules that have required fields filled
        if (!data.fromAddress && !data.fromName) return;

        // Validate: if one required field is set, both must be
        if (!data.fromAddress || !data.fromName) {
          throw new Error(`${def.module}: Both "From Address" and "From Name" are required.`);
        }

        const response = await apiRequest('/api/v1/settings/email-config', {
          method: 'POST',
          body: {
            propertyId,
            moduleKey: def.moduleKey,
            fromEmail: data.fromAddress,
            fromName: data.fromName,
            replyTo: data.replyToAddress || undefined,
            isActive: true,
          },
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.message || `Failed to save ${def.module} configuration.`);
        }
      });

      await Promise.all(savePromises);
      showSaveMessage('success', 'Email configuration saved successfully.');
      refetch();
    } catch (err: any) {
      showSaveMessage('error', err.message || 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  }, [moduleFormData, propertyId, refetch, showSaveMessage]);

  // Build the modules array with current form data
  const modules: EmailModuleConfig[] = MODULE_DEFS.map((def, index) => ({
    id: String(index + 1),
    module: def.module,
    moduleKey: def.moduleKey,
    icon: def.icon,
    iconColor: def.iconColor,
    iconBg: def.iconBg,
    fromAddress: moduleFormData[def.moduleKey]?.fromAddress ?? '',
    fromName: moduleFormData[def.moduleKey]?.fromName ?? '',
    replyToAddress: moduleFormData[def.moduleKey]?.replyToAddress ?? '',
  }));

  // Loading skeleton
  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 py-8">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
            Email Configuration
          </h1>
          <p className="mt-1 text-[14px] text-neutral-500">
            Configure per-module email addresses, signatures, and delivery settings.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-8 py-8">
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 text-[14px] font-medium text-neutral-500 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <EmptyState
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Failed to load email configuration"
          description={error}
          action={
            <Button variant="secondary" size="sm" onClick={refetch}>
              Try Again
            </Button>
          }
        />
      </div>
    );
  }

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
        <h1 className="text-[24px] font-bold tracking-tight text-neutral-900">
          Email Configuration
        </h1>
        <p className="mt-1 text-[14px] text-neutral-500">
          Configure per-module email addresses, signatures, and delivery settings.
        </p>
      </div>

      {/* Save feedback message */}
      {saveMessage && (
        <div
          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-[14px] ${
            saveMessage.type === 'success'
              ? 'border-success-200 bg-success-50 text-success-700'
              : 'border-error-200 bg-error-50 text-error-700'
          }`}
        >
          {saveMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0" />
          )}
          {saveMessage.text}
        </div>
      )}

      {/* Module Email Addresses */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Module Email Addresses
        </h2>
        <div className="flex flex-col gap-3">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Card key={mod.id}>
                <CardContent>
                  <div className="mb-4 flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${mod.iconBg}`}
                    >
                      <Icon className={`h-5 w-5 ${mod.iconColor}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[15px] font-semibold text-neutral-900">{mod.module}</h3>
                      <p className="text-[13px] text-neutral-500">
                        Emails sent from the {mod.module.toLowerCase()} module
                      </p>
                    </div>
                    <Badge variant="success" size="md" dot>
                      Active
                    </Badge>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="From Address"
                        type="email"
                        value={mod.fromAddress}
                        onChange={(e) =>
                          updateModuleField(mod.moduleKey, 'fromAddress', e.target.value)
                        }
                        disabled={isSaving}
                      />
                      <Input
                        label="From Name"
                        value={mod.fromName}
                        onChange={(e) =>
                          updateModuleField(mod.moduleKey, 'fromName', e.target.value)
                        }
                        disabled={isSaving}
                      />
                    </div>
                    <Input
                      label="Reply-To Address"
                      type="email"
                      value={mod.replyToAddress}
                      onChange={(e) =>
                        updateModuleField(mod.moduleKey, 'replyToAddress', e.target.value)
                      }
                      helperText="Address recipients will reply to."
                      disabled={isSaving}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Global CC */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Global CC Settings
        </h2>
        <Card>
          <CardContent>
            <Input
              label="Global CC Address"
              type="email"
              value={globalCc}
              onChange={(e) => setGlobalCc(e.target.value)}
              placeholder="management@example.com"
              helperText="If set, this address will be CC'd on all outgoing emails from every module."
              disabled={isSaving}
            />
          </CardContent>
        </Card>
      </div>

      {/* Email Signature */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Email Signature
        </h2>
        <Card>
          <CardContent>
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email-signature"
                className="text-[14px] font-medium tracking-[-0.01em] text-neutral-700"
              >
                Signature Text
              </label>
              <textarea
                id="email-signature"
                rows={5}
                value={emailSignature}
                onChange={(e) => setEmailSignature(e.target.value)}
                disabled={isSaving}
                className="focus:border-primary-500 focus:ring-primary-100 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-[15px] text-neutral-900 transition-all duration-200 ease-out hover:border-neutral-300 focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-[13px] text-neutral-500">
                This signature is appended to all outgoing emails. Supports plain text only.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delivery Failure Tracking */}
      <div>
        <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
          Delivery Settings
        </h2>
        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-warning-50 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                  <Bell className="text-warning-600 h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-neutral-900">
                    Delivery Failure Tracking
                  </h3>
                  <p className="text-[13px] text-neutral-500">
                    Track bounced emails and failed deliveries. Get notified when emails cannot be
                    delivered.
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={deliveryFailureTracking}
                onClick={() => setDeliveryFailureTracking(!deliveryFailureTracking)}
                disabled={isSaving}
                className={`focus:ring-primary-100 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-4 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                  deliveryFailureTracking ? 'bg-primary-500' : 'bg-neutral-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    deliveryFailureTracking ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save */}
      <div className="flex justify-end pt-2">
        <Button size="lg" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  );
}
