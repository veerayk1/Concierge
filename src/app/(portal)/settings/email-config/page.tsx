'use client';

/**
 * Email Configuration Settings Page
 * Configure module-specific email sender details (from, reply-to, etc.)
 */

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, AlertTriangle, Loader2 } from 'lucide-react';
import { useApi, apiUrl, apiRequest } from '@/lib/hooks/use-api';
import { getPropertyId } from '@/lib/demo-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

interface EmailModuleConfig {
  id: string;
  moduleKey: string;
  moduleName: string;
  fromEmail: string;
  fromName: string;
  replyTo: string;
  active: boolean;
}

interface EditFormState {
  fromEmail: string;
  fromName: string;
  replyTo: string;
  active: boolean;
}

const MODULES = [
  { key: 'packages', name: 'Packages' },
  { key: 'maintenance', name: 'Maintenance' },
  { key: 'announcements', name: 'Announcements' },
  { key: 'security', name: 'Security' },
  { key: 'amenities', name: 'Amenities' },
  { key: 'events', name: 'Events' },
  { key: 'visitors', name: 'Visitors' },
  { key: 'general', name: 'General Notifications' },
];

export default function EmailConfigPage() {
  const propertyId = getPropertyId();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    fromEmail: '',
    fromName: '',
    replyTo: '',
    active: true,
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const {
    data: configsResponse,
    loading,
    error,
    refetch,
  } = useApi<any>(apiUrl('/api/v1/settings/email-config', { propertyId }));

  const configMap = useMemo(() => {
    const map: Record<string, EmailModuleConfig> = {};
    // API returns { propertyId, configs: [...] } — useApi unwraps .data
    const configs =
      configsResponse?.configs ?? (Array.isArray(configsResponse) ? configsResponse : []);
    if (configs && Array.isArray(configs)) {
      configs.forEach((c: any) => {
        map[c.moduleKey] = c;
      });
    }
    return map;
  }, [configsResponse]);

  const displayConfigs = useMemo(() => {
    return MODULES.map((mod) => ({
      ...mod,
      config: {
        id: `new-${mod.key}`,
        moduleKey: mod.key,
        moduleName: mod.name,
        fromEmail: '',
        fromName: '',
        replyTo: '',
        active: true,
        ...(configMap[mod.key] || {}),
        // Ensure active defaults to true when not stored in DB
        ...(configMap[mod.key] && configMap[mod.key]?.active === undefined ? { active: true } : {}),
      },
    }));
  }, [configMap]);

  function openEdit(item: (typeof displayConfigs)[0]) {
    setEditingId(item.key);
    setEditForm({
      fromEmail: item.config.fromEmail,
      fromName: item.config.fromName,
      replyTo: item.config.replyTo,
      active: item.config.active,
    });
    setSaveError(null);
  }

  async function handleSave() {
    if (!editingId) return;

    if (!editForm.fromEmail || !editForm.fromName) {
      setSaveError('From Email and From Name are required');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const response = await apiRequest(`/api/v1/settings/email-config`, {
        method: 'POST',
        body: {
          propertyId,
          moduleKey: editingId,
          fromEmail: editForm.fromEmail,
          fromName: editForm.fromName,
          replyTo: editForm.replyTo,
          isActive: editForm.active,
        },
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        setSaveError(result.message || `Failed to save configuration (${response.status})`);
        return;
      }

      setEditingId(null);
      refetch();
    } catch {
      setSaveError('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Link href="/settings">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-[28px] font-bold text-neutral-900">Email Configuration</h1>
            <p className="mt-1 text-[14px] text-neutral-500">
              Configure module-specific email sender details.
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <EmptyState
            icon={<AlertTriangle className="h-6 w-6" />}
            title="Failed to load configurations"
            description={error}
            action={
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Try Again
              </Button>
            }
          />
        )}

        {/* Content */}
        {!loading && !error && (
          <div className="space-y-4">
            {displayConfigs.map((item) => (
              <Card key={item.key} padding="md">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-1 items-start gap-3">
                    <Mail className="mt-1 h-5 w-5 text-neutral-400" />
                    <div className="flex-1">
                      <h3 className="text-[14px] font-semibold text-neutral-900">{item.name}</h3>
                      <div className="mt-2 space-y-1">
                        {item.config.fromEmail && (
                          <p className="text-[13px] text-neutral-600">
                            From: <span className="font-medium">{item.config.fromName}</span> &lt;
                            {item.config.fromEmail}&gt;
                          </p>
                        )}
                        {item.config.replyTo && (
                          <p className="text-[13px] text-neutral-600">
                            Reply-to: <span className="font-medium">{item.config.replyTo}</span>
                          </p>
                        )}
                        {!item.config.fromEmail && (
                          <p className="text-[13px] text-neutral-400">No configuration yet</p>
                        )}
                      </div>
                      {!item.config.active && (
                        <Badge variant="default" className="mt-2 bg-neutral-200 text-neutral-700">
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => openEdit(item)}>
                    Edit
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingId}
        onOpenChange={(open) => {
          if (!open) setEditingId(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogTitle className="flex items-center gap-2 text-[18px] font-bold text-neutral-900">
            <Mail className="text-primary-500 h-5 w-5" />
            Edit Email Configuration
          </DialogTitle>
          <DialogDescription className="text-[14px] text-neutral-500">
            Configure the sender email address and reply-to details for this module.
          </DialogDescription>

          <div className="mt-6 flex flex-col gap-4">
            {saveError && (
              <div className="border-error-200 bg-error-50 text-error-700 rounded-xl border px-4 py-3 text-[14px]">
                {saveError}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                From Name<span className="text-error-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={editForm.fromName}
                onChange={(e) => setEditForm({ ...editForm, fromName: e.target.value })}
                placeholder="e.g., The Residence"
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none"
                disabled={isSaving}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">
                From Email<span className="text-error-500 ml-0.5">*</span>
              </label>
              <input
                type="email"
                value={editForm.fromEmail}
                onChange={(e) => setEditForm({ ...editForm, fromEmail: e.target.value })}
                placeholder="e.g., noreply@property.com"
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none"
                disabled={isSaving}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-medium text-neutral-700">Reply-To Email</label>
              <input
                type="email"
                value={editForm.replyTo}
                onChange={(e) => setEditForm({ ...editForm, replyTo: e.target.value })}
                placeholder="e.g., support@property.com"
                className="focus:border-primary-500 focus:ring-primary-100 h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-[15px] text-neutral-900 transition-all duration-200 focus:ring-4 focus:outline-none"
                disabled={isSaving}
              />
            </div>

            <label className="flex cursor-pointer items-center gap-3 text-[14px] font-medium text-neutral-700">
              <input
                type="checkbox"
                checked={editForm.active}
                onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                disabled={isSaving}
                className="text-primary-500 focus:ring-primary-500 h-4 w-4 rounded border-neutral-300 focus:ring-2"
              />
              Active
            </label>

            <div className="mt-2 flex gap-2 border-t border-neutral-200 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingId(null)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}
