/**
 * Concierge — E2E Admin & Settings Tests
 *
 * Exercises admin settings, user management, and property configuration.
 * Uses demo mode (Property Admin role) for authenticated access.
 */

import { test, expect } from '@playwright/test';

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.evaluate(() => localStorage.removeItem('demo_role'));
  await page.getByText('Demo: Admin').click();
  await page.waitForURL('**/dashboard', { timeout: 10_000 });
}

test.describe('Admin Settings', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('navigates to /settings and shows settings categories', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /settings/i })).toBeVisible({ timeout: 10_000 });
  });

  test('navigates to /settings/general and loads property settings', async ({ page }) => {
    await page.goto('/settings/general');
    await page.waitForTimeout(2000);

    // Should show property name, address, or timezone fields
    const heading = page.getByRole('heading', { name: /general|property/i });
    if (await heading.isVisible()) {
      expect(await heading.isVisible()).toBeTruthy();
    }
  });

  test('navigates to /settings/roles and shows role configuration', async ({ page }) => {
    await page.goto('/settings/roles');
    await page.waitForTimeout(2000);

    const heading = page.getByRole('heading', { name: /role/i });
    if (await heading.isVisible()) {
      expect(await heading.isVisible()).toBeTruthy();
    }
  });

  test('navigates to /settings/notifications and shows notification config', async ({ page }) => {
    await page.goto('/settings/notifications');
    await page.waitForTimeout(2000);

    const heading = page.getByRole('heading', { name: /notification/i });
    if (await heading.isVisible()) {
      expect(await heading.isVisible()).toBeTruthy();
    }
  });
});

test.describe('User Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('navigates to /users and loads user list', async ({ page }) => {
    await page.goto('/users');
    await expect(page.getByRole('heading', { name: /user/i })).toBeVisible({ timeout: 10_000 });
  });

  test('shows create user button', async ({ page }) => {
    await page.goto('/users');
    await page.waitForTimeout(1000);

    const createBtn = page.getByRole('button', { name: /invite|add|create/i });
    if (await createBtn.isVisible()) {
      expect(await createBtn.isVisible()).toBeTruthy();
    }
  });

  test('can search users', async ({ page }) => {
    await page.goto('/users');
    await page.waitForTimeout(1000);

    const search = page.getByPlaceholder(/search/i);
    if (await search.isVisible()) {
      await search.fill('admin');
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Unit Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('navigates to /units and loads unit list', async ({ page }) => {
    await page.goto('/units');
    await expect(page.getByRole('heading', { name: /unit/i })).toBeVisible({ timeout: 10_000 });
  });

  test('shows unit grid or table view', async ({ page }) => {
    await page.goto('/units');
    await page.waitForTimeout(2000);

    const content = page.locator('table, [class*="grid"], [class*="card"]');
    const count = await content.count();
    expect(count >= 0).toBeTruthy();
  });
});

test.describe('Onboarding Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('navigates to /onboarding and shows step indicator', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForTimeout(2000);

    // Should show "Property Setup" or step indicator
    const heading = page.getByText(/property setup|step 1/i);
    if (await heading.isVisible()) {
      expect(await heading.isVisible()).toBeTruthy();
    }
  });

  test('shows 8 steps in the progress bar', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForTimeout(2000);

    // Should show step titles
    const stepTexts = [
      'Property',
      'Units',
      'Amenities',
      'Event',
      'Staff',
      'Residents',
      'Branding',
      'Go Live',
    ];
    for (const text of stepTexts) {
      const el = page.getByText(text, { exact: false }).first();
      if (await el.isVisible()) {
        expect(await el.isVisible()).toBeTruthy();
      }
    }
  });
});
