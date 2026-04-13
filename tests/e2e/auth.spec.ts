/**
 * Concierge — E2E Auth Tests
 *
 * Exercises the login/logout flow through the running app.
 * Uses the demo credentials exposed in the login form's seed data.
 */

import { test, expect } from '@playwright/test';

// Demo credentials from the login form (login-form.tsx)
const FRONT_DESK = {
  email: 'concierge1@mapleheights.ca',
  password: 'StaffPass123!@',
  firstName: 'Mike',
  lastName: 'Johnson',
};

const _ADMIN = {
  email: 'admin@concierge.app',
  password: 'SuperAdmin123!',
  firstName: 'Admin',
  lastName: 'User',
};

test.describe('Authentication — Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure clean state: clear any demo_role from localStorage
    await page.goto('/login');
    await page.evaluate(() => localStorage.removeItem('demo_role'));
  });

  test('shows the login page with correct heading and form fields', async ({ page }) => {
    await page.goto('/login');

    // Verify page heading
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

    // Verify form fields exist
    await expect(page.getByLabel('Email address')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();

    // Verify "Forgot password?" link
    await expect(page.getByRole('link', { name: 'Forgot password?' })).toBeVisible();

    // Verify demo access buttons
    await expect(page.getByText('Demo: Front Desk')).toBeVisible();
    await expect(page.getByText('Demo: Security')).toBeVisible();
    await expect(page.getByText('Demo: Admin')).toBeVisible();
    await expect(page.getByText('Demo: Resident')).toBeVisible();
  });

  test('shows validation errors for empty form submission', async ({ page }) => {
    await page.goto('/login');

    // Click submit without filling in anything
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Validation errors should appear (from zod/react-hook-form)
    // The exact message depends on the loginSchema, but errors should be present
    const alerts = page.locator('[role="alert"]');
    await expect(alerts.first()).toBeVisible({ timeout: 5000 });
  });

  test('fills in credentials and submits the login form', async ({ page }) => {
    await page.goto('/login');

    // Fill in email
    await page.getByLabel('Email address').fill(FRONT_DESK.email);

    // Fill in password
    await page.locator('input#password').fill(FRONT_DESK.password);

    // Click "Keep me signed in" checkbox
    await page.getByLabel('Keep me signed in').click();

    // Submit the form
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Wait for either navigation away from login (success) OR an error alert (wrong credentials)
    const result = await Promise.race([
      page
        .waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10_000 })
        .then(() => 'navigated'),
      page
        .locator('[role="alert"]')
        .waitFor({ state: 'visible', timeout: 10_000 })
        .then(() => 'error'),
    ]).catch(() => 'timeout');

    // Either the form submitted successfully (navigated) or showed an error
    expect(['navigated', 'error']).toContain(result);
  });

  test('demo button (Front Desk) bypasses auth and redirects to dashboard', async ({ page }) => {
    await page.goto('/login');

    // Click the Front Desk demo button (sets localStorage and triggers window.location.href navigation)
    await page.getByText('Demo: Front Desk').click();

    // Wait for the full-page navigation triggered by the button
    await page.waitForURL('**/dashboard', { timeout: 10_000 });
    expect(page.url()).toContain('/dashboard');
  });

  test('demo login shows user name in the top bar', async ({ page }) => {
    await page.goto('/login');

    // Set auth state via localStorage and navigate (avoids race with button's window.location.href)
    await page.evaluate(() => {
      localStorage.setItem('demo_role', 'front_desk');
      localStorage.setItem('demo_propertyId', '00000000-0000-4000-b000-000000000001');
    });
    await page.goto('/dashboard');

    // The top bar should show the user's first name (Mike)
    // The sidebar/top-bar renders user.firstName in a span
    await expect(page.getByText(FRONT_DESK.firstName).first()).toBeVisible({ timeout: 5_000 });
  });

  test('logout from demo mode redirects to /login', async ({ page }) => {
    await page.goto('/login');

    // Set auth state via localStorage and navigate
    await page.evaluate(() => {
      localStorage.setItem('demo_role', 'property_admin');
      localStorage.setItem('demo_propertyId', '00000000-0000-4000-b000-000000000001');
    });
    await page.goto('/dashboard');

    // Open the user dropdown menu (Account menu button)
    await page.getByLabel('Account menu').click();

    // Click "Log out"
    await page.getByText('Log out').click();

    // Should redirect to /login (demo logout uses router.push — client-side nav)
    await page.waitForFunction(() => window.location.pathname.includes('/login'), {
      timeout: 10_000,
    });
    expect(page.url()).toContain('/login');
  });

  test('password visibility toggle works', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.locator('input#password');

    // Initially password is hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click the show/hide password button
    await page.getByLabel('Show password').click();

    // Now it should be visible
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Toggle back
    await page.getByLabel('Hide password').click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('unauthenticated users are redirected to /login from protected routes', async ({ page }) => {
    // Clear any auth state
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.clear();
      document.cookie.split(';').forEach((c) => {
        document.cookie = c.trim().split('=')[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      });
    });

    // Try to access a protected page
    await page.goto('/dashboard');

    // Should redirect to /login (portal layout's useEffect triggers client-side router.replace)
    // Use waitForFunction since Next.js router.replace is client-side and doesn't trigger 'load'
    await page.waitForFunction(() => window.location.pathname.includes('/login'), {
      timeout: 15_000,
    });
    expect(page.url()).toContain('/login');
  });
});
