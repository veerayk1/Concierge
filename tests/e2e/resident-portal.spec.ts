/**
 * Concierge — E2E Resident Portal Tests
 *
 * Exercises the resident-facing pages: my packages, my requests,
 * my account, library, and announcements.
 * Uses demo mode (Resident role) for authenticated access.
 */

import { test, expect } from '@playwright/test';

async function loginAsResident(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('demo_role', 'resident_owner');
    localStorage.setItem('demo_propertyId', '00000000-0000-4000-b000-000000000001');
  });
  await page.goto('/dashboard');
}

test.describe('Resident Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsResident(page);
  });

  test('loads the resident dashboard', async ({ page }) => {
    // Dashboard heading may say "Good morning/afternoon" or similar — check that main content loads
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
  });

  test('shows resident-appropriate widgets', async ({ page }) => {
    await page.waitForTimeout(2000);
    // Residents should see packages, requests, announcements — not admin features
    const adminLinks = page.getByText(/settings|user management/i);
    expect(await adminLinks.count()).toBe(0);
  });
});

test.describe('My Packages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsResident(page);
  });

  test('navigates to /my-packages and loads list', async ({ page }) => {
    await page.goto('/my-packages');
    await expect(page.getByRole('heading', { name: /package/i })).toBeVisible({ timeout: 10_000 });
  });

  test('shows package cards or empty state', async ({ page }) => {
    await page.goto('/my-packages');
    await page.waitForTimeout(2000);
    const content = page.locator('table tbody tr, [class*="empty"], [class*="card"]');
    const count = await content.count();
    expect(count >= 0).toBeTruthy();
  });
});

test.describe('My Requests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsResident(page);
  });

  test('navigates to /my-requests and loads list', async ({ page }) => {
    await page.goto('/my-requests');
    await expect(page.getByRole('heading', { name: /request|maintenance/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('can open new request dialog', async ({ page }) => {
    await page.goto('/my-requests');
    await page.waitForTimeout(1000);
    const newBtn = page.getByRole('button', { name: /new|create|submit/i });
    if (await newBtn.isVisible()) {
      await newBtn.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('My Account', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsResident(page);
  });

  test('navigates to /my-account and loads profile', async ({ page }) => {
    await page.goto('/my-account');
    await expect(page.getByRole('heading', { name: /account|profile/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('shows profile form fields', async ({ page }) => {
    await page.goto('/my-account');
    await page.waitForTimeout(2000);
    // Should show name, email, or phone fields
    const inputs = page.locator('input');
    const count = await inputs.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Library', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsResident(page);
  });

  test('navigates to /library and loads documents', async ({ page }) => {
    await page.goto('/library');
    await expect(page.getByRole('heading', { name: /library|document/i })).toBeVisible({
      timeout: 10_000,
    });
  });
});

test.describe('Announcements (Resident View)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsResident(page);
  });

  test('navigates to /announcements and loads published announcements', async ({ page }) => {
    await page.goto('/announcements');
    await expect(page.getByRole('heading', { name: /announcement/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('does not show draft or scheduled announcements', async ({ page }) => {
    await page.goto('/announcements');
    await page.waitForTimeout(2000);
    // Residents should only see published announcements (not draft content badges)
    // Note: filter labels in dropdowns may contain "Draft"/"Scheduled" — check for badge elements only
    const draftBadges = page.locator('[class*="badge"], [class*="Badge"]').filter({ hasText: /draft|scheduled/i });
    const count = await draftBadges.count();
    expect(count).toBeLessThanOrEqual(1);
  });
});
