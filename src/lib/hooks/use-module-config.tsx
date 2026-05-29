'use client';

/**
 * Module Configuration Hook & Context
 *
 * Fetches the feature flag state for the current property and provides:
 *   - isModuleEnabled(key) — check if a module is on
 *   - enabledModules — Set of enabled module keys
 *   - disabledNavItemIds — Set of nav item IDs to hide from sidebar
 *   - loading — whether the config is still loading
 *   - toggleModule(key, enabled) — update a module toggle (admin only)
 *
 * @module lib/hooks/use-module-config
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { getPropertyId } from '@/lib/demo-config';
import { getHiddenNavItemIds, type ModuleKey, MODULE_DEFINITIONS } from '@/lib/module-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ModuleFlag {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  tier: string;
}

interface ModuleConfigContextValue {
  /** Whether the config is still loading from the API */
  loading: boolean;
  /** Set of enabled module keys */
  enabledModules: Set<ModuleKey>;
  /** Set of nav item IDs that should be hidden */
  disabledNavItemIds: Set<string>;
  /** Check if a specific module is enabled */
  isModuleEnabled: (key: ModuleKey) => boolean;
  /** Toggle a module on/off (triggers API call) */
  toggleModule: (key: ModuleKey, enabled: boolean) => Promise<void>;
  /** Raw flag data from the API */
  flags: ModuleFlag[];
  /** Force a refetch */
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ModuleConfigContext = createContext<ModuleConfigContextValue>({
  loading: true,
  enabledModules: new Set(),
  disabledNavItemIds: new Set(),
  isModuleEnabled: () => true,
  toggleModule: async () => {},
  flags: [],
  refetch: () => {},
});

export function useModuleConfig() {
  return useContext(ModuleConfigContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

function getAuthHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const headers: Record<string, string> = {};
  const rawDemoRole = localStorage.getItem('demo_role');
  if (rawDemoRole) {
    const ROLE_ALIASES: Record<string, string> = {
      resident: 'resident_owner',
      owner: 'resident_owner',
      tenant: 'resident_tenant',
      security: 'security_guard',
      maintenance: 'maintenance_staff',
      admin: 'property_admin',
      manager: 'property_manager',
    };
    headers['x-demo-role'] = ROLE_ALIASES[rawDemoRole] ?? rawDemoRole;
    const demoMode = localStorage.getItem('demo_mode');
    if (demoMode) headers['x-demo-mode'] = demoMode;
    return headers;
  }
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function defaultFlagFor(m: (typeof MODULE_DEFINITIONS)[number]): ModuleFlag {
  return {
    key: m.key,
    name: m.name,
    description: m.description,
    enabled: m.tier === 'starter' || m.tier === 'professional',
    tier: m.tier,
  };
}

function mergeServerFlags(serverFlags: ModuleFlag[]): ModuleFlag[] {
  const byKey = new Map(serverFlags.map((f) => [f.key, f]));
  return MODULE_DEFINITIONS.map((m) => byKey.get(m.key) ?? defaultFlagFor(m));
}

export function ModuleConfigProvider({ children }: { children: ReactNode }) {
  // Seed with tier-based defaults so the sidebar doesn't flash a
  // "everything disabled" state while the feature-flags API is in flight.
  // Without this, every resident briefly sees a stripped sidebar (no
  // My Packages, My Requests, Amenity Booking) during the first render
  // pass, because flags=[] makes enabledModules empty which makes every
  // nav-gated item appear "disabled".
  const [flags, setFlags] = useState<ModuleFlag[]>(() => MODULE_DEFINITIONS.map(defaultFlagFor));
  const [loading, setLoading] = useState(true);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    const propertyId = getPropertyId();

    async function load() {
      try {
        const res = await fetch(
          `/api/v1/feature-flags?propertyId=${encodeURIComponent(propertyId)}`,
          { headers: getAuthHeaders() },
        );
        if (!res.ok) {
          // If API fails (e.g., non-admin role), fall back to tier-based defaults
          if (!cancelled) {
            setFlags(MODULE_DEFINITIONS.map(defaultFlagFor));
            setLoading(false);
          }
          return;
        }
        const json = await res.json();
        if (!cancelled) {
          // Merge: server flags are authoritative for keys they cover; any module
          // missing from the response falls back to its tier-based default. This
          // prevents a partial flags list (e.g. right after onboarding provisions
          // a new property) from disabling every module not yet flagged.
          setFlags(mergeServerFlags(json.data ?? []));
          setLoading(false);
        }
      } catch {
        // On error, assume tier-based defaults
        if (!cancelled) {
          setFlags(MODULE_DEFINITIONS.map(defaultFlagFor));
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [fetchKey]);

  const enabledModules = useMemo(() => {
    const set = new Set<ModuleKey>();
    for (const flag of flags) {
      if (flag.enabled) {
        set.add(flag.key as ModuleKey);
      }
    }
    return set;
  }, [flags]);

  const disabledModules = useMemo(() => {
    const set = new Set<ModuleKey>();
    for (const mod of MODULE_DEFINITIONS) {
      if (!enabledModules.has(mod.key)) {
        set.add(mod.key);
      }
    }
    return set;
  }, [enabledModules]);

  const disabledNavItemIds = useMemo(() => getHiddenNavItemIds(disabledModules), [disabledModules]);

  const isModuleEnabled = useCallback(
    (key: ModuleKey) => enabledModules.has(key),
    [enabledModules],
  );

  const toggleModule = useCallback(async (key: ModuleKey, enabled: boolean) => {
    const propertyId = getPropertyId();
    await fetch('/api/v1/feature-flags', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ propertyId, key, enabled }),
    });
    // Optimistically update local state
    setFlags((prev) => prev.map((f) => (f.key === key ? { ...f, enabled } : f)));
  }, []);

  const value = useMemo<ModuleConfigContextValue>(
    () => ({
      loading,
      enabledModules,
      disabledNavItemIds,
      isModuleEnabled,
      toggleModule,
      flags,
      refetch,
    }),
    [loading, enabledModules, disabledNavItemIds, isModuleEnabled, toggleModule, flags, refetch],
  );

  return <ModuleConfigContext.Provider value={value}>{children}</ModuleConfigContext.Provider>;
}
