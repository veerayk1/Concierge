import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ModuleConfigProvider, useModuleConfig } from '../use-module-config';
import { MODULE_DEFINITIONS } from '@/lib/module-config';

vi.mock('@/lib/demo-config', () => ({
  getPropertyId: () => 'test-property-id',
}));

function Probe() {
  const { loading, enabledModules, disabledNavItemIds } = useModuleConfig();
  if (loading) return <div>loading</div>;
  return (
    <div>
      <div data-testid="enabled">{Array.from(enabledModules).sort().join(',')}</div>
      <div data-testid="hidden">{Array.from(disabledNavItemIds).sort().join(',')}</div>
    </div>
  );
}

function mockFetchOnce(response: { ok: boolean; data?: unknown }) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: response.ok,
    json: async () => ({ data: response.data }),
  }) as unknown as typeof fetch;
}

describe('useModuleConfig (merge semantics)', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to tier-based defaults when API returns non-ok', async () => {
    mockFetchOnce({ ok: false });

    render(
      <ModuleConfigProvider>
        <Probe />
      </ModuleConfigProvider>,
    );

    await waitFor(() => expect(screen.queryByText('loading')).toBeNull());

    const enabled = screen.getByTestId('enabled').textContent!.split(',').filter(Boolean);
    // starter + professional modules are enabled by default; enterprise are not
    const expectedEnabled = MODULE_DEFINITIONS.filter(
      (m) => m.tier === 'starter' || m.tier === 'professional',
    ).map((m) => m.key);
    expect(enabled.sort()).toEqual(expectedEnabled.sort());
  });

  it('merges a partial server flag list onto tier-based defaults so missing keys stay enabled', async () => {
    // Simulate a freshly-provisioned property whose feature_flags table only
    // has rows for a couple of modules. Every other module should fall back
    // to its tier-based default rather than being treated as disabled.
    mockFetchOnce({
      ok: true,
      data: [
        { key: 'packages', name: 'Packages', description: '', enabled: false, tier: 'starter' },
        { key: 'ai_features', name: 'AI', description: '', enabled: true, tier: 'enterprise' },
      ],
    });

    render(
      <ModuleConfigProvider>
        <Probe />
      </ModuleConfigProvider>,
    );

    await waitFor(() => expect(screen.queryByText('loading')).toBeNull());

    const enabled = new Set(screen.getByTestId('enabled').textContent!.split(',').filter(Boolean));

    // Server override wins for keys it covers
    expect(enabled.has('packages')).toBe(false); // explicitly disabled by server
    expect(enabled.has('ai_features')).toBe(true); // explicitly enabled by server

    // Missing keys default to tier-based enablement
    expect(enabled.has('maintenance')).toBe(true); // starter, missing -> default true
    expect(enabled.has('amenity_booking')).toBe(true); // starter, missing -> default true
    expect(enabled.has('announcements')).toBe(true); // starter, missing -> default true
    expect(enabled.has('reports')).toBe(true); // professional, missing -> default true
    expect(enabled.has('white_label')).toBe(false); // enterprise, missing -> default false
    expect(enabled.has('sso')).toBe(false); // enterprise, missing -> default false
  });

  it('does not hide resident self-service nav items when the server flag list is partial', async () => {
    // Regression: previously a partial flag list caused every module not in
    // the response to be treated as disabled, hiding /my-packages, /my-requests,
    // /amenity-booking, /announcements from the resident sidebar.
    mockFetchOnce({
      ok: true,
      data: [
        // Only a single unrelated entry — none of the resident modules are covered
        { key: 'sso', name: 'SSO', description: '', enabled: false, tier: 'enterprise' },
      ],
    });

    render(
      <ModuleConfigProvider>
        <Probe />
      </ModuleConfigProvider>,
    );

    await waitFor(() => expect(screen.queryByText('loading')).toBeNull());

    const hidden = new Set(screen.getByTestId('hidden').textContent!.split(',').filter(Boolean));

    expect(hidden.has('my-packages')).toBe(false);
    expect(hidden.has('my-requests')).toBe(false);
    expect(hidden.has('amenity-booking')).toBe(false);
    expect(hidden.has('resident-announcements')).toBe(false);
  });

  it('honors a full server response that disables a module', async () => {
    mockFetchOnce({
      ok: true,
      data: MODULE_DEFINITIONS.map((m) => ({
        key: m.key,
        name: m.name,
        description: m.description,
        enabled: m.key === 'packages' ? false : m.tier !== 'enterprise',
        tier: m.tier,
      })),
    });

    render(
      <ModuleConfigProvider>
        <Probe />
      </ModuleConfigProvider>,
    );

    await waitFor(() => expect(screen.queryByText('loading')).toBeNull());

    const enabled = new Set(screen.getByTestId('enabled').textContent!.split(',').filter(Boolean));
    expect(enabled.has('packages')).toBe(false);
    expect(enabled.has('maintenance')).toBe(true);
  });

  it('falls back to tier-based defaults when fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch;

    render(
      <ModuleConfigProvider>
        <Probe />
      </ModuleConfigProvider>,
    );

    await waitFor(() => expect(screen.queryByText('loading')).toBeNull());

    const enabled = new Set(screen.getByTestId('enabled').textContent!.split(',').filter(Boolean));
    // On error path the fallback marks ALL modules enabled? No — the production
    // hook treats fetch errors the same as a !ok response: tier-based defaults.
    expect(enabled.has('packages')).toBe(true);
    expect(enabled.has('sso')).toBe(false);
  });
});
