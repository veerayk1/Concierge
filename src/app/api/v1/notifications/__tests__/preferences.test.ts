/**
 * Notification Preferences API Tests — per PRD 08 Section 3.1.8
 *
 * Users control which notifications they receive per channel.
 * Getting defaults wrong means residents miss package notifications
 * or get spammed with irrelevant alerts.
 */

import { describe, expect, it, vi } from 'vitest';
import { createGetRequest, parseResponse } from '@/test/helpers/api';

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'resident-1',
      propertyId: 'prop-1',
      role: 'resident_owner',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

import { GET } from '../../notifications/preferences/route';

describe('GET /api/v1/notifications/preferences', () => {
  it('returns 400 without userId', async () => {
    const req = createGetRequest('/api/v1/notifications/preferences');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('returns default preferences organized by module', async () => {
    const req = createGetRequest('/api/v1/notifications/preferences', {
      searchParams: { userId: 'user-1' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { module: string; email: boolean; sms: boolean; push: boolean }[];
    }>(res);
    expect(body.data.length).toBeGreaterThan(0);

    // Every preference should have module + 3 channel booleans
    for (const pref of body.data) {
      expect(pref.module).toBeDefined();
      expect(typeof pref.email).toBe('boolean');
      expect(typeof pref.sms).toBe('boolean');
      expect(typeof pref.push).toBe('boolean');
    }
  });

  it('includes package notifications — most important for residents', async () => {
    const req = createGetRequest('/api/v1/notifications/preferences', {
      searchParams: { userId: 'user-1' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: { module: string; notificationType: string }[] }>(res);

    const packagePrefs = body.data.filter((p) => p.module === 'Packages');
    expect(packagePrefs.length).toBeGreaterThan(0);
    expect(packagePrefs.some((p) => p.notificationType.includes('Package received'))).toBe(true);
  });

  it('includes account security notifications with SMS enabled by default', async () => {
    const req = createGetRequest('/api/v1/notifications/preferences', {
      searchParams: { userId: 'user-1' },
    });
    const res = await GET(req);
    const body = await parseResponse<{
      data: { module: string; notificationType: string; sms: boolean }[];
    }>(res);

    const loginPref = body.data.find((p) => p.notificationType === 'Login from new device');
    expect(loginPref).toBeDefined();
    expect(loginPref?.sms).toBe(true); // Security alerts via SMS by default
  });

  it('covers all required modules per PRD 08', async () => {
    const req = createGetRequest('/api/v1/notifications/preferences', {
      searchParams: { userId: 'user-1' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: { module: string }[] }>(res);

    const modules = [...new Set(body.data.map((p) => p.module))];
    expect(modules).toContain('Packages');
    expect(modules).toContain('Maintenance');
    expect(modules).toContain('Amenities');
    expect(modules).toContain('Announcements');
    expect(modules).toContain('Account');
  });
});
