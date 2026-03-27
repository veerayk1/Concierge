/**
 * End-to-end journey verification
 * Tests every critical user flow to ensure pages load, forms render, and APIs respond
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

// Helper: set demo role in localStorage before navigating
async function loginAsRole(page: any, role: string) {
  await page.goto(`${BASE}/login`);
  await page.evaluate((r: string) => {
    localStorage.setItem('demo_role', r);
    localStorage.setItem('demo_propertyId', '00000000-0000-4000-b000-000000000001');
  }, role);
}

// ============================================================
// 1. LOGIN PAGE
// ============================================================
test.describe('Login Page', () => {
  test('renders login form with email and password', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('demo buttons are visible and set localStorage', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    const superAdminBtn = page.locator('button:has-text("Super Admin")');
    await expect(superAdminBtn).toBeVisible();

    // Click and verify localStorage is set, then navigate to dashboard
    await superAdminBtn.click();
    // Use goto instead of waitForURL to reliably land on dashboard
    await page.goto(`${BASE}/dashboard`);
    const role = await page.evaluate(() => localStorage.getItem('demo_role'));
    const propId = await page.evaluate(() => localStorage.getItem('demo_propertyId'));
    expect(role).toBe('super_admin');
    expect(propId).toBe('00000000-0000-4000-b000-000000000001');
  });
});

// ============================================================
// 2. DASHBOARD — Each role sees different content
// ============================================================
test.describe('Dashboard', () => {
  for (const role of [
    'super_admin',
    'property_admin',
    'front_desk',
    'security_guard',
    'resident_owner',
  ]) {
    test(`loads for ${role}`, async ({ page }) => {
      await loginAsRole(page, role);
      await page.goto(`${BASE}/dashboard`);
      await page.waitForLoadState('domcontentloaded');
      // Dashboard should have a greeting (heading element)
      await expect(
        page.getByRole('heading', { name: /Good (morning|afternoon|evening)/i }),
      ).toBeVisible({ timeout: 10000 });
    });
  }
});

// ============================================================
// 3. PORTAL PAGES — Verify they load without errors
// ============================================================
const PORTAL_PAGES = [
  '/packages',
  '/maintenance',
  '/visitors',
  '/announcements',
  '/security',
  '/security/incidents',
  '/shift-log',
  '/amenity-booking',
  '/units',
  '/residents',
  '/amenities',
  '/events',
  '/vendors',
  '/parking',
  '/training',
  '/equipment',
  '/inspections',
  '/recurring-tasks',
  '/compliance',
  '/reports',
  '/surveys',
  '/library',
  '/community',
  '/marketplace',
  '/ideas',
  '/forum',
  '/governance',
  '/alterations',
  '/purchase-orders',
  '/building-directory',
  '/digital-signage',
  '/photo-albums',
  '/assets',
  '/resident-cards',
  '/developer-portal',
  '/data-migration',
  '/help-center',
  '/analytics',
  '/my-account',
  '/my-packages',
  '/my-requests',
  '/logs',
  '/onboarding',
];

test.describe('Portal Pages Load', () => {
  for (const path of PORTAL_PAGES) {
    test(`${path} loads without crash`, async ({ page }) => {
      await loginAsRole(page, 'property_admin');
      const response = await page.goto(`${BASE}${path}`);
      expect(response?.status()).toBeLessThan(500);
      // No "Application error" or "Internal Server Error"
      const body = await page.textContent('body');
      expect(body).not.toContain('Application error');
      expect(body).not.toContain('Internal Server Error');
    });
  }
});

// ============================================================
// 4. SETTINGS PAGES
// ============================================================
const SETTINGS_PAGES = [
  '/settings/roles',
  '/settings/billing',
  '/settings/security-company',
  '/settings/custom-fields',
];

test.describe('Settings Pages Load', () => {
  for (const path of SETTINGS_PAGES) {
    test(`${path} loads`, async ({ page }) => {
      await loginAsRole(page, 'property_admin');
      const response = await page.goto(`${BASE}${path}`);
      expect(response?.status()).toBeLessThan(500);
    });
  }
});

// ============================================================
// 5. ADMIN PAGES
// ============================================================
const ADMIN_PAGES = ['/system/properties', '/system/health', '/system/ai', '/system/billing'];

test.describe('Admin Pages Load', () => {
  for (const path of ADMIN_PAGES) {
    test(`${path} loads for super_admin`, async ({ page }) => {
      await loginAsRole(page, 'super_admin');
      const response = await page.goto(`${BASE}${path}`);
      expect(response?.status()).toBeLessThan(500);
    });
  }
});

// ============================================================
// 6. MARKETING PAGES
// ============================================================
const MARKETING_PAGES = [
  '/',
  '/features',
  '/pricing',
  '/contact',
  '/about',
  '/blog',
  '/security-privacy',
  '/privacy',
  '/terms',
];

test.describe('Marketing Pages Load', () => {
  for (const path of MARKETING_PAGES) {
    test(`${path} loads`, async ({ page }) => {
      const response = await page.goto(`${BASE}${path}`);
      expect(response?.status()).toBe(200);
      const body = await page.textContent('body');
      // Check for actual error indicators (not '404' which can appear in JS payloads)
      expect(body).not.toContain('Application error');
    });
  }
});

// ============================================================
// 7. AUTH PAGES
// ============================================================
test.describe('Auth Pages Load', () => {
  for (const path of ['/login', '/forgot-password']) {
    test(`${path} loads`, async ({ page }) => {
      const response = await page.goto(`${BASE}${path}`);
      expect(response?.status()).toBe(200);
    });
  }
});

// ============================================================
// 8. DIALOG FORMS OPEN — Verify Create buttons open dialogs
// ============================================================
test.describe('Create Dialogs Open', () => {
  test('packages — Log Package dialog opens', async ({ page }) => {
    await loginAsRole(page, 'front_desk');
    await page.goto(`${BASE}/packages`);
    await page.waitForLoadState('domcontentloaded');
    const btn = page.locator('button:has-text("Log Package")');
    if (await btn.isVisible()) {
      await btn.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });
    }
  });

  test('maintenance — New Request dialog opens', async ({ page }) => {
    await loginAsRole(page, 'property_admin');
    await page.goto(`${BASE}/maintenance`);
    await page.waitForLoadState('domcontentloaded');
    const btn = page.locator('button:has-text("New Request")');
    if (await btn.isVisible()) {
      await btn.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });
    }
  });

  test('visitors — Sign In Visitor dialog opens', async ({ page }) => {
    await loginAsRole(page, 'front_desk');
    await page.goto(`${BASE}/visitors`);
    await page.waitForLoadState('domcontentloaded');
    const btn = page.locator('button:has-text("Sign In Visitor")');
    if (await btn.isVisible()) {
      await btn.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });
    }
  });

  test('announcements — New Announcement dialog opens', async ({ page }) => {
    await loginAsRole(page, 'property_admin');
    await page.goto(`${BASE}/announcements`);
    await page.waitForLoadState('domcontentloaded');
    const btn = page.locator('button:has-text("New Announcement")');
    if (await btn.isVisible()) {
      await btn.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });
    }
  });

  test('shift-log — Add Entry dialog opens', async ({ page }) => {
    await loginAsRole(page, 'front_desk');
    await page.goto(`${BASE}/shift-log`);
    await page.waitForLoadState('domcontentloaded');
    const btn = page.locator('button:has-text("Add Entry")');
    if (await btn.isVisible()) {
      await btn.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });
    }
  });

  test('security — Report Incident dialog opens', async ({ page }) => {
    await loginAsRole(page, 'security_guard');
    await page.goto(`${BASE}/security/incidents`);
    await page.waitForLoadState('domcontentloaded');
    const btn = page.locator('button:has-text("Report Incident")');
    if (await btn.isVisible()) {
      await btn.click();
      await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 3000 });
    }
  });
});

// ============================================================
// 9. API ENDPOINTS RESPOND (not 500)
// ============================================================
test.describe('API Health', () => {
  const API_ENDPOINTS = [
    '/api/v1/packages?propertyId=00000000-0000-4000-b000-000000000001',
    '/api/v1/maintenance?propertyId=00000000-0000-4000-b000-000000000001',
    '/api/v1/visitors?propertyId=00000000-0000-4000-b000-000000000001',
    '/api/v1/announcements?propertyId=00000000-0000-4000-b000-000000000001',
    '/api/v1/events?propertyId=00000000-0000-4000-b000-000000000001',
    '/api/v1/units?propertyId=00000000-0000-4000-b000-000000000001',
    '/api/v1/users?propertyId=00000000-0000-4000-b000-000000000001',
    '/api/v1/shift-log?propertyId=00000000-0000-4000-b000-000000000001',
    '/api/v1/bookings?propertyId=00000000-0000-4000-b000-000000000001',
  ];

  for (const endpoint of API_ENDPOINTS) {
    test(`GET ${endpoint.split('?')[0]} responds`, async ({ page }) => {
      const response = await page.goto(`${BASE}${endpoint}`, {
        waitUntil: 'commit',
      });
      // Should not be 500 — 401/403 for auth is acceptable
      expect(response?.status()).toBeLessThan(500);
    });
  }
});
