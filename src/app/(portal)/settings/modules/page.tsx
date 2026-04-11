'use client';

/**
 * Settings > Modules — Enable/disable modules for this property
 *
 * - Super Admin: can toggle ALL modules for any property
 * - Property Admin: can toggle modules within what Super Admin has enabled
 * - Other roles: redirected (no access)
 */

import { useState, useCallback } from 'react';
import {
  Package,
  Wrench,
  Shield,
  CalendarDays,
  ScrollText,
  Users,
  Key,
  Car,
  GraduationCap,
  Megaphone,
  Store,
  BarChart3,
  Brain,
  Code2,
  Building,
  type LucideIcon,
} from 'lucide-react';
import { useModuleConfig } from '@/lib/hooks/use-module-config';
import {
  MODULE_DEFINITIONS,
  getModulesByCategory,
  CATEGORY_LABELS,
  TIER_LABELS,
  TIER_COLORS,
  type ModuleKey,
} from '@/lib/module-config';

// ---------------------------------------------------------------------------
// Icon map
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  Package,
  Wrench,
  Shield,
  CalendarDays,
  ScrollText,
  Users,
  Key,
  Car,
  GraduationCap,
  Megaphone,
  Store,
  BarChart3,
  Brain,
  Code2,
  Building,
};

// ---------------------------------------------------------------------------
// Toggle Switch Component
// ---------------------------------------------------------------------------

function Toggle({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`focus-visible:ring-primary-500 relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${enabled ? 'bg-primary-500' : 'bg-neutral-200'} ${disabled ? 'cursor-not-allowed opacity-50' : ''} `}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'} `}
      />
    </button>
  );
}

// ---------------------------------------------------------------------------
// Module Card
// ---------------------------------------------------------------------------

function ModuleCard({
  moduleKey,
  name,
  description,
  tier,
  iconName,
  enabled,
  toggling,
  onToggle,
}: {
  moduleKey: ModuleKey;
  name: string;
  description: string;
  tier: string;
  iconName: string;
  enabled: boolean;
  toggling: boolean;
  onToggle: (key: ModuleKey, enabled: boolean) => void;
}) {
  const Icon = ICON_MAP[iconName] ?? Package;
  const tierColor = TIER_COLORS[tier] ?? TIER_COLORS.starter;

  return (
    <div
      className={`group relative rounded-2xl border bg-white p-5 transition-all duration-200 ${enabled ? 'border-neutral-200 shadow-sm' : 'border-neutral-100 bg-neutral-50/50 opacity-70'} `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3.5">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${enabled ? 'bg-primary-50' : 'bg-neutral-100'} `}
          >
            <Icon className={`h-5 w-5 ${enabled ? 'text-primary-500' : 'text-neutral-400'}`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-semibold text-neutral-900">{name}</h3>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${tierColor.bg} ${tierColor.text}`}
              >
                {TIER_LABELS[tier] ?? tier}
              </span>
            </div>
            <p className="mt-0.5 text-[13px] leading-relaxed text-neutral-500">{description}</p>
          </div>
        </div>
        <div className="ml-4 shrink-0">
          <Toggle
            enabled={enabled}
            onChange={(val) => onToggle(moduleKey, val)}
            disabled={toggling}
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ModulesSettingsPage() {
  const { flags, toggleModule, loading } = useModuleConfig();
  const [togglingKeys, setTogglingKeys] = useState<Set<ModuleKey>>(new Set());

  const handleToggle = useCallback(
    async (key: ModuleKey, enabled: boolean) => {
      setTogglingKeys((prev) => new Set(prev).add(key));
      try {
        await toggleModule(key, enabled);
      } finally {
        setTogglingKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    },
    [toggleModule],
  );

  const grouped = getModulesByCategory();

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-neutral-200" />
          <div className="mt-2 h-5 w-80 animate-pulse rounded-lg bg-neutral-100" />
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-neutral-100" />
          ))}
        </div>
      </div>
    );
  }

  // Build a lookup from flag key to enabled status
  const flagMap = new Map(flags.map((f) => [f.key, f.enabled]));

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-bold tracking-tight text-neutral-900">Modules</h1>
        <p className="mt-1 text-[15px] text-neutral-500">
          Enable or disable modules for this property. Disabled modules are hidden from all users
          and their features become unavailable.
        </p>
      </div>

      {/* Module Grid by Category */}
      <div className="flex flex-col gap-10">
        {Object.entries(grouped).map(([category, modules]) => (
          <section key={category}>
            <h2 className="mb-4 text-[12px] font-semibold tracking-[0.08em] text-neutral-400 uppercase">
              {CATEGORY_LABELS[category] ?? category}
            </h2>
            <div className="grid gap-3">
              {modules.map((mod) => (
                <ModuleCard
                  key={mod.key}
                  moduleKey={mod.key}
                  name={mod.name}
                  description={mod.description}
                  tier={mod.tier}
                  iconName={mod.iconName}
                  enabled={flagMap.get(mod.key) ?? true}
                  toggling={togglingKeys.has(mod.key)}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
