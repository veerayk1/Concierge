/**
 * Targeted verification — visits pages that showed spinner/empty states
 * and waits until they fully load before screenshotting.
 */
import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots', 'verify');
fs.mkdirSync(DIR, { recursive: true });

async function loginAs(page: import('@playwright/test').Page, role: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(
    ({ role, pid }: { role: string; pid: string }) => {
      localStorage.clear();
      localStorage.setItem('demo_role', role);
      localStorage.setItem('demo_propertyId', pid);
    },
    { role, pid: '00000000-0000-4000-b000-000000000001' },
  );
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(1000);
}

async function waitForContent(page: import('@playwright/test').Page, timeout = 10000) {
  // 1. Give React time to hydrate and render the loading state
  await page.waitForTimeout(1500);
  // 2. Wait until spinners and "Loading" text disappear
  try {
    await page.waitForFunction(
      () => {
        const spinners = document.querySelectorAll('.animate-spin');
        const loadingTexts = Array.from(document.querySelectorAll('p')).filter((el) =>
          el.textContent?.toLowerCase().includes('loading'),
        );
        return spinners.length === 0 && loadingTexts.length === 0;
      },
      { timeout },
    );
  } catch {
    // Timeout is OK — take screenshot anyway
  }
}

/** Extra wait for pages that show skeleton loaders instead of spinners */
async function waitForSkeletons(page: import('@playwright/test').Page) {
  // Skeleton components render with bg-neutral-100 in a div — wait for actual content
  // by checking that there are non-empty headings or table rows visible
  try {
    await page.waitForFunction(
      () => {
        // Any heading with real text means the page content loaded
        const headings = Array.from(document.querySelectorAll('h1, h2, h3')).filter(
          (el) => (el.textContent?.trim().length ?? 0) > 2,
        );
        // OR a table with rows
        const tableRows = document.querySelectorAll('tbody tr').length;
        // OR some specific card content
        const cards = Array.from(document.querySelectorAll('[class*="Card"] p, .card p')).filter(
          (el) => (el.textContent?.trim().length ?? 0) > 2,
        );
        return headings.length > 1 || tableRows > 0 || cards.length > 0;
      },
      { timeout: 10000 },
    );
  } catch {
    // Timeout OK
  }
}

async function run() {
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    args: ['--window-size=1920,1080'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();

  console.log('═══════════════════════════════════════════════');
  console.log('  Targeted Verification Screenshots');
  console.log('═══════════════════════════════════════════════');

  // --- Packages (Front Desk) ---
  console.log('\n  Packages...');
  await loginAs(page, 'front_desk');
  await page.goto(`${BASE_URL}/packages`);
  await waitForContent(page);
  await page.screenshot({ path: path.join(DIR, 'packages.png'), fullPage: true });
  console.log(`  ✓ packages.png`);

  // --- Maintenance (Property Manager) ---
  console.log('  Maintenance...');
  await loginAs(page, 'property_manager');
  await page.goto(`${BASE_URL}/maintenance`);
  await waitForContent(page);
  await page.screenshot({ path: path.join(DIR, 'maintenance.png'), fullPage: true });
  console.log(`  ✓ maintenance.png`);

  // --- Security (Security Guard) ---
  console.log('  Security Console...');
  await loginAs(page, 'security_guard');
  await page.goto(`${BASE_URL}/security`);
  await waitForContent(page);
  await page.screenshot({ path: path.join(DIR, 'security.png'), fullPage: true });
  console.log(`  ✓ security.png`);

  // --- Training (Front Desk) ---
  console.log('  Training...');
  await loginAs(page, 'front_desk');
  await page.goto(`${BASE_URL}/training`);
  await waitForContent(page);
  await page.screenshot({ path: path.join(DIR, 'training.png'), fullPage: true });
  console.log(`  ✓ training.png`);

  // --- Unit Detail (navigate directly) ---
  console.log('  Unit detail...');
  await loginAs(page, 'property_admin');
  // Navigate directly to unit 101 (seeded demo unit — predictable ID)
  const unitId = '00000000-0000-4000-d000-0000unit0101';
  await page.goto(`${BASE_URL}/units/${unitId}`);
  await waitForSkeletons(page);
  await page.screenshot({ path: path.join(DIR, 'unit-detail.png'), fullPage: true });
  console.log(`  ✓ unit-detail.png  (URL: ${page.url()})`);

  // --- Reports (generate a report) ---
  console.log('  Reports generate...');
  await loginAs(page, 'property_admin');
  await page.goto(`${BASE_URL}/reports`);
  await waitForContent(page);
  await page.screenshot({ path: path.join(DIR, 'reports-before.png'), fullPage: true });
  // Hover over first card to reveal Generate button
  const firstCard = page.locator('[class*="group"]').first();
  if (await firstCard.isVisible()) {
    await firstCard.hover();
    await page.waitForTimeout(300);
    const generateBtn = page.getByRole('button', { name: /generate/i }).first();
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      await page.waitForTimeout(3000);
      console.log(`  ✓ reports generate clicked`);
    }
  }
  await page.screenshot({ path: path.join(DIR, 'reports-after.png'), fullPage: true });

  // --- Resident portal /my-packages ---
  console.log('  Resident /my-packages...');
  await loginAs(page, 'resident_owner');
  await page.goto(`${BASE_URL}/my-packages`);
  await waitForSkeletons(page);
  await page.screenshot({ path: path.join(DIR, 'resident-my-packages.png'), fullPage: true });
  console.log(`  ✓ resident-my-packages.png  (URL: ${page.url()})`);

  // --- Bug button submits to DB ---
  console.log('  Bug button submit...');
  await loginAs(page, 'front_desk');
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(2000);
  // Trigger button has title="Report a bug (Shift+D)"
  const bugBtn = page.locator('button[title="Report a bug (Shift+D)"]').first();
  if (await bugBtn.isVisible()) {
    await bugBtn.click();
    await page.waitForTimeout(800);
    // Modal is a plain div — find it by the textarea
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) {
      await textarea.fill('Verification test — bug report modal works correctly.');
      const submitBtn = page.getByRole('button', { name: /submit bug report/i }).first();
      await submitBtn.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: path.join(DIR, 'bug-button-submitted.png'), fullPage: true });
      console.log(`  ✓ bug-button-submitted.png`);
    } else {
      console.log(`  ⚠ modal textarea not found`);
    }
  } else {
    console.log(`  ⚠ bug button not found`);
  }

  // --- Debug dashboard shows the submitted event ---
  console.log('  Debug Intelligence (after bug submit)...');
  await loginAs(page, 'super_admin');
  await page.goto(`${BASE_URL}/system/debug`);
  await waitForContent(page);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(DIR, 'debug-after-submit.png'), fullPage: true });
  console.log(`  ✓ debug-after-submit.png`);

  console.log(`\n  All screenshots saved to: ${DIR}`);
  console.log('═══════════════════════════════════════════════\n');

  await ctx.close();
  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
