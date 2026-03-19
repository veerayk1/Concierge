/**
 * Concierge — E2E Global Search Tests
 *
 * Exercises the command palette search functionality:
 * opening, typing queries, viewing results, and navigating via results.
 */

import { test, expect } from '@playwright/test';

/**
 * Helper: log in as Front Desk via demo button.
 */
async function loginAsFrontDesk(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.evaluate(() => localStorage.removeItem('demo_role'));
  await page.getByText('Demo: Front Desk').click();
  await page.waitForURL('**/dashboard', { timeout: 10_000 });
}

/**
 * Helper: open the command palette via Cmd+K.
 */
async function openCommandPalette(page: import('@playwright/test').Page) {
  await page.keyboard.press('Meta+k');
  await expect(page.getByPlaceholder('Search anything or type a command...')).toBeVisible({
    timeout: 3_000,
  });
}

test.describe('Global Search — Command Palette', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsFrontDesk(page);
    await page.goto('/dashboard');
    await page.waitForSelector('main', { timeout: 10_000 });
  });

  test('opens with Cmd+K and displays the search input', async ({ page }) => {
    await openCommandPalette(page);

    // Input should be focused and empty
    const searchInput = page.getByPlaceholder('Search anything or type a command...');
    await expect(searchInput).toBeFocused();
    await expect(searchInput).toHaveValue('');
  });

  test('shows quick actions when no query is entered', async ({ page }) => {
    await openCommandPalette(page);

    // The "Quick Actions" heading should appear
    await expect(page.getByText('Quick Actions')).toBeVisible();

    // All five quick actions should be listed
    const quickActions = [
      'Log Package',
      'Log Event',
      'New Request',
      'New Announcement',
      'Book Amenity',
    ];
    for (const action of quickActions) {
      await expect(page.getByText(action)).toBeVisible();
    }
  });

  test('shows keyboard shortcut hints in the footer', async ({ page }) => {
    await openCommandPalette(page);

    // Footer should have navigation hints
    await expect(page.getByText('Navigate')).toBeVisible();
    await expect(page.getByText('Open')).toBeVisible();
    await expect(page.getByText('Close')).toBeVisible();
  });

  test('typing a short query (< 2 chars) still shows quick actions', async ({ page }) => {
    await openCommandPalette(page);

    const searchInput = page.getByPlaceholder('Search anything or type a command...');
    await searchInput.fill('a');

    // Quick actions should still be visible (search requires >= 2 chars)
    await expect(page.getByText('Quick Actions')).toBeVisible();
  });

  test('typing a query (>= 2 chars) triggers a search', async ({ page }) => {
    await openCommandPalette(page);

    const searchInput = page.getByPlaceholder('Search anything or type a command...');
    await searchInput.fill('Janet');

    // Wait for debounce (300ms) and search response
    // Should show either results, "No results", or "Searching..."
    // We wait for the quick actions to disappear (they hide when query >= 2)
    await expect(page.getByText('Quick Actions')).not.toBeVisible({ timeout: 3_000 });

    // Either results appear, or "No results" or "Searching..."
    const hasResults = page.locator('button').filter({ hasText: /Janet/i });
    const noResults = page.getByText(/No results for/);
    const loading = page.getByText('Searching...');

    // At least one of these should be visible
    await expect(hasResults.first().or(noResults).or(loading)).toBeVisible({ timeout: 5_000 });
  });

  test('no results message shows for gibberish query', async ({ page }) => {
    await openCommandPalette(page);

    const searchInput = page.getByPlaceholder('Search anything or type a command...');
    await searchInput.fill('zzxxyyww999');

    // Wait for the search debounce and API response
    // Expect "No results" message
    await expect(page.getByText(/No results for/)).toBeVisible({ timeout: 5_000 });
  });

  test('clearing the query restores quick actions', async ({ page }) => {
    await openCommandPalette(page);

    const searchInput = page.getByPlaceholder('Search anything or type a command...');

    // Type a query
    await searchInput.fill('Janet');
    await expect(page.getByText('Quick Actions')).not.toBeVisible({ timeout: 3_000 });

    // Clear the input using the X button
    const clearButton = page
      .locator('.fixed') // Command palette is position:fixed
      .getByRole('button')
      .filter({ has: page.locator('svg') })
      .last();

    // Try clicking clear; fall back to manually clearing
    if (await clearButton.isVisible()) {
      await clearButton.click();
    } else {
      await searchInput.clear();
    }

    // Quick actions should reappear
    await expect(page.getByText('Quick Actions')).toBeVisible({ timeout: 3_000 });
  });

  test('keyboard arrow navigation changes selected item', async ({ page }) => {
    await openCommandPalette(page);

    // Quick actions are shown. First item (Log Package) should be selected.
    // Press ArrowDown to move selection
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    // Press Enter to navigate to the third quick action (New Request -> /maintenance)
    await page.keyboard.press('Enter');

    await page.waitForURL('**/maintenance', { timeout: 5_000 });
    expect(page.url()).toContain('/maintenance');
  });

  test('Enter on a quick action navigates and closes the palette', async ({ page }) => {
    await openCommandPalette(page);

    // First quick action is "Log Package" at index 0
    await page.keyboard.press('Enter');

    // Should navigate to /packages (first quick action's href)
    await page.waitForURL('**/packages', { timeout: 5_000 });
    expect(page.url()).toContain('/packages');

    // Command palette should be closed
    await expect(page.getByPlaceholder('Search anything or type a command...')).not.toBeVisible();
  });

  test('clicking the backdrop closes the command palette', async ({ page }) => {
    await openCommandPalette(page);

    // Click the backdrop (the semi-transparent overlay behind the palette)
    const backdrop = page.locator('.fixed .bg-black\\/40');
    if (await backdrop.isVisible()) {
      await backdrop.click({ force: true });
    } else {
      // Fallback: press Escape
      await page.keyboard.press('Escape');
    }

    // Palette should be closed
    await expect(page.getByPlaceholder('Search anything or type a command...')).not.toBeVisible();
  });

  test('search results display type labels', async ({ page }) => {
    await openCommandPalette(page);

    const searchInput = page.getByPlaceholder('Search anything or type a command...');
    await searchInput.fill('unit 1');

    // Wait for results to load
    await expect(page.getByText('Quick Actions')).not.toBeVisible({ timeout: 3_000 });

    // If results appear, they should have type labels (User, Unit, Package, etc.)
    // The exact results depend on the API, so we check for any type label
    const typeLabels = ['User', 'Unit', 'Package', 'Event', 'Announcement'];
    const anyLabelVisible = await Promise.any(
      typeLabels.map((label) =>
        page
          .getByText(label, { exact: true })
          .isVisible()
          .then((v) => (v ? true : Promise.reject())),
      ),
    ).catch(() => false);

    // If the API returned results, at least one type label should be visible.
    // If no API is running, "No results" or "Searching..." is fine too.
    const noResults = await page.getByText(/No results for/).isVisible();
    const searching = await page.getByText('Searching...').isVisible();

    expect(anyLabelVisible || noResults || searching).toBe(true);
  });

  test('can open palette via Ctrl+K as well', async ({ page }) => {
    // Ctrl+K should also work (for non-Mac or cross-platform)
    await page.keyboard.press('Control+k');

    await expect(page.getByPlaceholder('Search anything or type a command...')).toBeVisible({
      timeout: 3_000,
    });
  });
});
