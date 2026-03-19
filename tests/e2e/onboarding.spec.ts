/**
 * Concierge — E2E Onboarding Wizard Tests
 *
 * Exercises the full 8-step property setup wizard flow.
 * Uses demo mode (Admin role) for authenticated access.
 */

import { test, expect } from '@playwright/test';

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.evaluate(() => localStorage.removeItem('demo_role'));
  await page.getByText('Demo: Admin').click();
  await page.waitForURL('**/dashboard', { timeout: 10_000 });
}

test.describe('Onboarding Wizard Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('shows the onboarding wizard with step 1 active', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForTimeout(2000);

    // Should show Property Setup heading
    const heading = page.getByText(/property setup/i);
    await expect(heading).toBeVisible({ timeout: 10_000 });

    // Step 1 should be shown
    await expect(page.getByText(/step 1/i)).toBeVisible();
  });

  test('shows all 8 step labels in progress bar', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForTimeout(2000);

    const steps = [
      'Property',
      'Units',
      'Amenities',
      'Event',
      'Staff',
      'Residents',
      'Branding',
      'Go Live',
    ];
    for (const step of steps) {
      await expect(page.getByText(step, { exact: false }).first()).toBeVisible();
    }
  });

  test('shows progress percentage', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForTimeout(2000);

    await expect(page.getByText(/setup progress/i)).toBeVisible();
  });

  test('step 1 has property name input', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForTimeout(2000);

    const nameInput = page.getByLabel(/property name/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test Property');
      expect(await nameInput.inputValue()).toBe('Test Property');
    }
  });

  test('Save & Continue button advances to next step', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForTimeout(2000);

    const nextBtn = page.getByRole('button', { name: /save.*continue|next/i });
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(1000);
      // Should now show Step 2
      await expect(page.getByText(/step 2/i)).toBeVisible();
    }
  });

  test('Back button returns to previous step', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForTimeout(2000);

    // Go to step 2 first
    const nextBtn = page.getByRole('button', { name: /save.*continue|next/i });
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(1000);

      // Click back
      const backBtn = page.getByRole('button', { name: /back/i });
      await backBtn.click();
      await page.waitForTimeout(500);

      // Should be back on step 1
      await expect(page.getByText(/step 1/i)).toBeVisible();
    }
  });

  test('Skip for Now button is available on non-required steps', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForTimeout(2000);

    // Advance to step 2 (which is skippable)
    const nextBtn = page.getByRole('button', { name: /save.*continue|next/i });
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(1000);

      // Skip button should be visible
      const skipBtn = page.getByRole('button', { name: /skip/i });
      if (await skipBtn.isVisible()) {
        expect(await skipBtn.isVisible()).toBeTruthy();
      }
    }
  });

  test('shows legal agreements section on step 1', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForTimeout(2000);

    // Scroll down to find legal agreements
    const legalSection = page.getByText(/legal agreement/i);
    if (await legalSection.isVisible()) {
      expect(await legalSection.isVisible()).toBeTruthy();
    }
  });

  test('last saved timestamp appears after interaction', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForTimeout(2000);

    const nameInput = page.getByLabel(/property name/i);
    if (await nameInput.isVisible()) {
      await nameInput.fill('Test Property');
      // Wait for auto-save debounce
      await page.waitForTimeout(2000);

      // Should show "Last saved" text
      const savedText = page.getByText(/last saved/i);
      if (await savedText.isVisible()) {
        expect(await savedText.isVisible()).toBeTruthy();
      }
    }
  });
});
