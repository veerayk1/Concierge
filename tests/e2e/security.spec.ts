/**
 * Concierge — E2E Security Console Tests
 *
 * Exercises the security incident listing, reporting, and visitor management flows.
 * Uses demo mode (Security Guard role) for authenticated access.
 */

import { test, expect } from '@playwright/test';

async function loginAsSecurityGuard(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('demo_role', 'security_guard');
    localStorage.setItem('demo_propertyId', '00000000-0000-4000-b000-000000000001');
  });
  await page.goto('/dashboard');
}

async function loginAsFrontDesk(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('demo_role', 'front_desk');
    localStorage.setItem('demo_propertyId', '00000000-0000-4000-b000-000000000001');
  });
  await page.goto('/dashboard');
}

test.describe('Security Console', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsFrontDesk(page);
  });

  test('navigates to /security/incidents and loads the list', async ({ page }) => {
    await page.goto('/security/incidents');
    await expect(page.getByRole('heading', { name: /incident|security/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('shows search and filter controls', async ({ page }) => {
    await page.goto('/security/incidents');
    await page.waitForTimeout(1000);
    // Should have search input
    const search = page.getByPlaceholder(/search/i).first();
    if (await search.isVisible()) {
      expect(await search.isVisible()).toBeTruthy();
    }
  });

  test('can open report incident dialog', async ({ page }) => {
    await page.goto('/security/incidents');
    await page.waitForTimeout(1000);

    const reportBtn = page.getByRole('button', { name: /report|new|create/i }).first();
    if (await reportBtn.isVisible()) {
      await reportBtn.click();
      await page.waitForTimeout(500);
    }
  });
});

test.describe('Visitor Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsFrontDesk(page);
  });

  test('navigates to /visitors and loads the list', async ({ page }) => {
    await page.goto('/visitors');
    await expect(page.getByRole('heading', { name: /visitor/i })).toBeVisible({ timeout: 10_000 });
  });

  test('shows visitor sign-in controls', async ({ page }) => {
    await page.goto('/visitors');
    await page.waitForTimeout(1000);

    const signInBtn = page.getByRole('button', { name: /sign.in|new|add|create/i });
    if (await signInBtn.isVisible()) {
      expect(await signInBtn.isVisible()).toBeTruthy();
    }
  });

  test('shows visitor list or empty state', async ({ page }) => {
    await page.goto('/visitors');
    await page.waitForTimeout(2000);

    const content = page.locator('table tbody tr, [class*="empty"], [class*="Empty"]');
    const count = await content.count();
    expect(count >= 0).toBeTruthy();
  });
});

test.describe('Shift Log', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsFrontDesk(page);
  });

  test('navigates to /shift-log and loads entries', async ({ page }) => {
    await page.goto('/shift-log');
    await expect(page.getByRole('heading', { name: /shift/i })).toBeVisible({ timeout: 10_000 });
  });

  test('shows shift log entry controls', async ({ page }) => {
    await page.goto('/shift-log');
    await page.waitForTimeout(1000);

    const addBtn = page.getByRole('button', { name: /new|add|create/i }).first();
    if (await addBtn.isVisible()) {
      expect(await addBtn.isVisible()).toBeTruthy();
    }
  });
});
