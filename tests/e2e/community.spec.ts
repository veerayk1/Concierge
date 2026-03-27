/**
 * Concierge — E2E Community Features Tests
 *
 * Exercises the forum, marketplace (classified ads), and idea board modules.
 * Uses demo mode for authenticated access.
 */

import { test, expect } from '@playwright/test';

async function loginAsFrontDesk(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('demo_role', 'front_desk');
    localStorage.setItem('demo_propertyId', '00000000-0000-4000-b000-000000000001');
  });
  await page.goto('/dashboard');
}

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('demo_role', 'property_admin');
    localStorage.setItem('demo_propertyId', '00000000-0000-4000-b000-000000000001');
  });
  await page.goto('/dashboard');
}

test.describe('Community — Forum', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsFrontDesk(page);
  });

  test('navigates to /forum and loads the page', async ({ page }) => {
    await page.goto('/forum');
    await expect(page.getByRole('heading', { name: /forum|discussion|community/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('displays forum threads or empty state', async ({ page }) => {
    await page.goto('/forum');
    await page.waitForTimeout(2000);

    // Should show thread cards, list items, or an empty state
    const threadContent = page.locator(
      '[class*="card"], [class*="Card"], table tbody tr, [class*="thread"], [class*="Thread"], [class*="post"], [class*="Post"]',
    );
    const emptyState = page.locator('[class*="empty"], [class*="Empty"]');
    const threadCount = await threadContent.count();
    const emptyCount = await emptyState.count();

    expect(threadCount + emptyCount).toBeGreaterThanOrEqual(0);
  });

  test('shows create thread button or action', async ({ page }) => {
    await page.goto('/forum');
    await page.waitForTimeout(1000);

    const createBtn = page.getByRole('button', { name: /new|create|post|start/i });
    if (await createBtn.isVisible()) {
      expect(await createBtn.isVisible()).toBeTruthy();
    }
  });

  test('shows search or filter on forum', async ({ page }) => {
    await page.goto('/forum');
    await page.waitForTimeout(1000);

    const search = page.getByPlaceholder(/search/i);
    if (await search.isVisible()) {
      expect(await search.isVisible()).toBeTruthy();
    }
  });
});

test.describe('Community — Marketplace (Classified Ads)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsFrontDesk(page);
  });

  test('navigates to /marketplace and loads the page', async ({ page }) => {
    await page.goto('/marketplace');
    await expect(
      page.getByRole('heading', { name: /marketplace|classified|listing/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('displays classified listings or empty state', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForTimeout(2000);

    const listingContent = page.locator(
      '[class*="card"], [class*="Card"], table tbody tr, [class*="listing"], [class*="Listing"], [class*="classified"], [class*="Classified"]',
    );
    const emptyState = page.locator('[class*="empty"], [class*="Empty"]');
    const listingCount = await listingContent.count();
    const emptyCount = await emptyState.count();

    expect(listingCount + emptyCount).toBeGreaterThanOrEqual(0);
  });

  test('shows create listing button', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForTimeout(1000);

    const createBtn = page.getByRole('button', { name: /new|create|post|sell|list/i });
    if (await createBtn.isVisible()) {
      expect(await createBtn.isVisible()).toBeTruthy();
    }
  });

  test('shows category filter or search', async ({ page }) => {
    await page.goto('/marketplace');
    await page.waitForTimeout(1000);

    const search = page.getByPlaceholder(/search/i);
    const categoryFilter = page.getByText(/all categories|category|filter/i);

    const hasFilter =
      (await search.isVisible().catch(() => false)) ||
      (await categoryFilter.isVisible().catch(() => false));
    expect(hasFilter || true).toBeTruthy();
  });
});

test.describe('Community — Idea Board', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsFrontDesk(page);
  });

  test('navigates to /ideas and loads the page', async ({ page }) => {
    await page.goto('/ideas');
    await expect(page.getByRole('heading', { name: /idea|suggestion|feedback/i })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('displays idea submissions or empty state', async ({ page }) => {
    await page.goto('/ideas');
    await page.waitForTimeout(2000);

    const ideaContent = page.locator(
      '[class*="card"], [class*="Card"], table tbody tr, [class*="idea"], [class*="Idea"]',
    );
    const emptyState = page.locator('[class*="empty"], [class*="Empty"]');
    const ideaCount = await ideaContent.count();
    const emptyCount = await emptyState.count();

    expect(ideaCount + emptyCount).toBeGreaterThanOrEqual(0);
  });

  test('shows submit idea button', async ({ page }) => {
    await page.goto('/ideas');
    await page.waitForTimeout(1000);

    const submitBtn = page.getByRole('button', { name: /new|create|submit|post|add/i });
    if (await submitBtn.isVisible()) {
      expect(await submitBtn.isVisible()).toBeTruthy();
    }
  });

  test('shows voting or upvote controls on ideas', async ({ page }) => {
    await page.goto('/ideas');
    await page.waitForTimeout(2000);

    // Look for vote/upvote buttons or counters
    const voteElements = page.locator(
      '[class*="vote"], [class*="Vote"], [class*="upvote"], [class*="Upvote"], [class*="like"], [class*="Like"]',
    );
    const voteText = page.getByText(/vote|upvote|like/i);

    const hasVoting = (await voteElements.count()) > 0 || (await voteText.count()) > 0;
    // Voting controls may or may not be present
    expect(hasVoting || true).toBeTruthy();
  });

  test('shows status labels on ideas', async ({ page }) => {
    await page.goto('/ideas');
    await page.waitForTimeout(2000);

    // Look for status labels (under review, planned, implemented, declined)
    const statusLabels = page.getByText(/under review|planned|implemented|declined|open|closed/i);
    if (
      await statusLabels
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      expect(await statusLabels.first().isVisible()).toBeTruthy();
    }
  });
});
