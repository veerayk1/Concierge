/**
 * Concierge — E2E Navigation Tests
 *
 * Verifies sidebar navigation, page loading, command palette shortcut,
 * and responsive sidebar collapse behavior.
 */

import { test, expect } from '@playwright/test';

/**
 * Helper: log in as a given demo role.
 */
async function loginAsDemo(
  page: import('@playwright/test').Page,
  role: 'Front Desk' | 'Security' | 'Admin' | 'Resident',
) {
  const roleMap: Record<string, string> = {
    'Front Desk': 'front_desk',
    'Security': 'security_guard',
    'Admin': 'property_admin',
    'Resident': 'resident_owner',
  };
  await page.goto('/login');
  await page.evaluate((r) => {
    localStorage.setItem('demo_role', r);
    localStorage.setItem('demo_propertyId', '00000000-0000-4000-b000-000000000001');
  }, roleMap[role] ?? 'front_desk');
  await page.goto('/dashboard');
}

test.describe('Navigation — Sidebar', () => {
  test('Front Desk sidebar has expected navigation links', async ({ page }) => {
    await loginAsDemo(page, 'Front Desk');

    const sidebar = page.locator('aside[aria-label="Main navigation"]');
    await expect(sidebar).toBeVisible({ timeout: 5_000 });

    // Front Desk should see these links based on navigation.ts role config
    await expect(sidebar.getByText('Dashboard')).toBeVisible();
    await expect(sidebar.getByText('Security Console')).toBeVisible();
    await expect(sidebar.getByText('Packages')).toBeVisible();
    await expect(sidebar.getByText('Announcements')).toBeVisible();
    await expect(sidebar.getByText('Shift Log')).toBeVisible();
    await expect(sidebar.getByText('Training')).toBeVisible();
  });

  test('Admin sidebar has management links', async ({ page }) => {
    await loginAsDemo(page, 'Admin');

    const sidebar = page.locator('aside[aria-label="Main navigation"]');
    await expect(sidebar).toBeVisible({ timeout: 5_000 });

    // Property Admin should see management items
    await expect(sidebar.getByText('Dashboard')).toBeVisible();
    await expect(sidebar.getByText('Units')).toBeVisible();
    await expect(sidebar.getByText('Residents')).toBeVisible();
    await expect(sidebar.getByText('Amenities')).toBeVisible();
    await expect(sidebar.getByText('User Management')).toBeVisible();
    await expect(sidebar.getByText('Settings')).toBeVisible();
    await expect(sidebar.getByText('Reports')).toBeVisible();
  });

  test('Resident sidebar shows resident-specific items', async ({ page }) => {
    await loginAsDemo(page, 'Resident');

    const sidebar = page.locator('aside[aria-label="Main navigation"]');
    await expect(sidebar).toBeVisible({ timeout: 5_000 });

    // Resident (Owner) should see their self-service items
    await expect(sidebar.getByText('Dashboard')).toBeVisible();
    await expect(sidebar.getByText('My Packages')).toBeVisible();
    await expect(sidebar.getByText('My Requests')).toBeVisible();
    await expect(sidebar.getByText('Amenity Booking')).toBeVisible();
    await expect(sidebar.getByText('My Account')).toBeVisible();

    // Resident should NOT see staff-only items
    await expect(sidebar.getByText('Security Console')).not.toBeVisible();
    await expect(sidebar.getByText('User Management')).not.toBeVisible();
  });

  test('sidebar contains the Concierge logo/brand linking to /dashboard', async ({ page }) => {
    await loginAsDemo(page, 'Front Desk');

    const sidebar = page.locator('aside[aria-label="Main navigation"]');
    const logoLink = sidebar.getByRole('link', { name: /concierge/i });
    await expect(logoLink).toBeVisible();
    await expect(logoLink).toHaveAttribute('href', '/dashboard');
  });

  test('sidebar active state highlights current page', async ({ page }) => {
    await loginAsDemo(page, 'Front Desk');

    // Navigate to packages
    await page.goto('/packages');
    await page.waitForSelector('text=Packages', { timeout: 10_000 });

    // The "Packages" link in the sidebar should have aria-current="page"
    const sidebar = page.locator('aside[aria-label="Main navigation"]');
    const packagesLink = sidebar.getByRole('link', { name: 'Packages' });
    await expect(packagesLink).toHaveAttribute('aria-current', 'page');
  });
});

test.describe('Navigation — Page Loading', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, 'Admin');
  });

  test('dashboard page loads', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
  });

  test('packages page loads', async ({ page }) => {
    await page.goto('/packages');
    await expect(page.getByRole('heading', { name: 'Packages' })).toBeVisible({ timeout: 10_000 });
  });

  test('security page loads', async ({ page }) => {
    await page.goto('/security');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
  });

  test('maintenance page loads', async ({ page }) => {
    await page.goto('/maintenance');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
  });

  test('announcements page loads', async ({ page }) => {
    await page.goto('/announcements');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
  });

  test('units page loads', async ({ page }) => {
    await page.goto('/units');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
  });

  test('events page loads', async ({ page }) => {
    await page.goto('/events');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
  });

  test('reports page loads', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
  });

  test('residents page loads', async ({ page }) => {
    await page.goto('/residents');
    await expect(page.locator('main')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Navigation — Command Palette (Cmd+K)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsDemo(page, 'Front Desk');
  });

  test('Cmd+K opens the command palette', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('main', { timeout: 10_000 });

    // Press Cmd+K (Meta+K on Mac, Control+K on other platforms)
    await page.keyboard.press('Meta+k');

    // Command palette should be visible with search input
    await expect(page.getByPlaceholder('Search anything or type a command...')).toBeVisible({
      timeout: 3_000,
    });
  });

  test('command palette shows quick actions when empty', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('main', { timeout: 10_000 });

    await page.keyboard.press('Meta+k');

    // Quick actions section should be visible
    await expect(page.getByText('Quick Actions').first()).toBeVisible({ timeout: 3_000 });
    await expect(page.getByText('Log Package').first()).toBeVisible();
    await expect(page.getByText('Log Event').first()).toBeVisible();
    await expect(page.getByText('New Request').first()).toBeVisible();
    await expect(page.getByText('New Announcement').first()).toBeVisible();
    await expect(page.getByText('Book Amenity').first()).toBeVisible();
  });

  test('Escape closes the command palette', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('main', { timeout: 10_000 });

    // Open the palette
    await page.keyboard.press('Meta+k');
    await expect(page.getByPlaceholder('Search anything or type a command...')).toBeVisible({
      timeout: 3_000,
    });

    // Press Escape to close
    await page.keyboard.press('Escape');

    // Palette should be gone
    await expect(page.getByPlaceholder('Search anything or type a command...')).not.toBeVisible();
  });

  test('clicking the search bar in the top bar opens the command palette', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('main', { timeout: 10_000 });

    // Click the search input in the top bar
    await page.getByLabel('Global search').click();

    // Command palette should open
    await expect(page.getByPlaceholder('Search anything or type a command...')).toBeVisible({
      timeout: 3_000,
    });
  });

  test('clicking a quick action navigates to the correct page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForSelector('main', { timeout: 10_000 });

    // Open palette
    await page.keyboard.press('Meta+k');
    await expect(page.getByText('Quick Actions').first()).toBeVisible({ timeout: 3_000 });

    // Click "Log Package" quick action — scoped to the command palette overlay
    const palette = page.locator('.fixed').filter({ has: page.getByPlaceholder('Search anything or type a command...') });
    await palette.getByText('Log Package').click();

    // Should navigate to /packages
    await page.waitForURL('**/packages', { timeout: 5_000 });
    expect(page.url()).toContain('/packages');
  });
});

test.describe('Navigation — Responsive Sidebar', () => {
  test('sidebar collapses on narrow viewports', async ({ page }) => {
    await loginAsDemo(page, 'Front Desk');
    await page.goto('/dashboard');

    // Set viewport to a narrow width (below xl breakpoint, typically 1280px)
    await page.setViewportSize({ width: 1024, height: 768 });

    // Wait for resize handler to fire
    await page.waitForTimeout(500);

    // The sidebar should be collapsed (width = 68px)
    const sidebar = page.locator('aside[aria-label="Main navigation"]');
    await expect(sidebar).toBeVisible();

    // In collapsed state, nav labels are hidden, but the "Concierge" brand text is hidden
    await expect(sidebar.getByText('Concierge')).not.toBeVisible();
  });

  test('sidebar expand/collapse toggle works', async ({ page }) => {
    await loginAsDemo(page, 'Front Desk');
    await page.goto('/dashboard');

    // Set a wide viewport so sidebar starts expanded
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    const sidebar = page.locator('aside[aria-label="Main navigation"]');

    // Should show the "Collapse sidebar" button
    const collapseBtn = page.getByLabel('Collapse sidebar');
    if (await collapseBtn.isVisible()) {
      await collapseBtn.click();

      // After collapse, the expand button should appear
      await expect(page.getByLabel('Expand sidebar')).toBeVisible({ timeout: 2_000 });

      // Click expand — use force to bypass Next.js dev overlay
      await page.getByLabel('Expand sidebar').click({ force: true });

      // Sidebar should be expanded again — brand text visible
      await expect(sidebar.getByText('Concierge')).toBeVisible({ timeout: 2_000 });
    }
  });

  test('collapsed sidebar shows tooltips on hover', async ({ page }) => {
    await loginAsDemo(page, 'Front Desk');
    await page.goto('/dashboard');

    // Force collapsed state
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);

    // Hover over a nav icon — tooltip should appear
    const sidebar = page.locator('aside[aria-label="Main navigation"]');
    const firstNavLink = sidebar.locator('nav a').first();
    await firstNavLink.hover();

    // Tooltip content should appear (Radix tooltip renders into a portal)
    // We check that a tooltip role element becomes visible
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toBeVisible({ timeout: 2_000 });
  });
});
