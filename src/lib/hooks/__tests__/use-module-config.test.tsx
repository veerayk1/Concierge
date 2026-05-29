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

// ---------------------------------------------------------------------------
// Regression: real-auth users must send Bearer token to /api/v1/feature-flags
//
// Before fix: getAuthHeaders only sent x-demo-role; real users got 401, the
// 401 fallback used tier defaults that disabled enterprise modules, and the
// sidebar collapsed to ~3 items even for roles that should see 9+.
// ---------------------------------------------------------------------------

describe('useModuleConfig (auth header)', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the auth_token as a Bearer token when no demo_role is set', async () => {
    localStorage.setItem('auth_token', 'tok-abc-123');

    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ data: [] }) }) as unknown as typeof fetch;
    global.fetch = fetchMock;

    render(
      <ModuleConfigProvider>
        <Probe />
      </ModuleConfigProvider>,
    );

    await waitFor(() => expect(screen.queryByText('loading')).toBeNull());

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = (fetchMock as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[1] as {
      headers?: Record<string, string>;
    };
    expect(init?.headers?.Authorization).toBe('Bearer tok-abc-123');
    // demo headers must not appear for real-auth users
    expect(init?.headers?.['x-demo-role']).toBeUndefined();
  });

  it('prefers x-demo-role when demo_role is set, ignores auth_token', async () => {
    localStorage.setItem('auth_token', 'tok-abc-123');
    localStorage.setItem('demo_role', 'front_desk');

    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ data: [] }) }) as unknown as typeof fetch;
    global.fetch = fetchMock;

    render(
      <ModuleConfigProvider>
        <Probe />
      </ModuleConfigProvider>,
    );

    await waitFor(() => expect(screen.queryByText('loading')).toBeNull());

    const init = (fetchMock as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[1] as {
      headers?: Record<string, string>;
    };
    expect(init?.headers?.['x-demo-role']).toBe('front_desk');
    expect(init?.headers?.Authorization).toBeUndefined();
  });

  it('sends no auth header when neither demo_role nor auth_token is set', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ data: [] }) }) as unknown as typeof fetch;
    global.fetch = fetchMock;

    render(
      <ModuleConfigProvider>
        <Probe />
      </ModuleConfigProvider>,
    );

    await waitFor(() => expect(screen.queryByText('loading')).toBeNull());

    const init = (fetchMock as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[1] as {
      headers?: Record<string, string>;
    };
    expect(init?.headers?.Authorization).toBeUndefined();
    expect(init?.headers?.['x-demo-role']).toBeUndefined();
  });
});
