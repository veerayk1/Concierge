/**
 * Network-level debugger — intercepts all requests and logs what happens
 * to the packages and maintenance API calls.
 */
import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const DIR = path.join(process.cwd(), 'test-results', 'debug-network');
fs.mkdirSync(DIR, { recursive: true });

async function run() {
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    args: ['--window-size=1400,900'],
  });

  const ctx = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });

  // Collect network events
  const networkLog: Array<{
    type: string;
    url: string;
    method?: string;
    status?: number;
    body?: string;
    error?: string;
    timing?: number;
  }> = [];

  const page = await ctx.newPage();

  // Intercept all API requests
  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const startTime = Date.now();
    try {
      const response = await route.fetch();
      const timing = Date.now() - startTime;
      const body = await response.text().catch(() => '<unreadable>');
      networkLog.push({
        type: 'response',
        url: req.url(),
        method: req.method(),
        status: response.status(),
        body: body.slice(0, 500),
        timing,
      });
      console.log(`[${req.method()}] ${req.url()} → ${response.status()} (${timing}ms)`);
      console.log(`  Body preview: ${body.slice(0, 200)}`);
      await route.fulfill({ response });
    } catch (err) {
      const timing = Date.now() - startTime;
      networkLog.push({
        type: 'error',
        url: req.url(),
        method: req.method(),
        error: String(err),
        timing,
      });
      console.log(`[ERROR] ${req.url()} → ${String(err)} (${timing}ms)`);
      await route.abort();
    }
  });

  // Also capture console messages
  page.on('console', (msg) => {
    console.log(`[console.${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', (err) => {
    console.log(`[PAGE ERROR] ${err.message}`);
  });

  // Login as front_desk
  console.log('\n=== Logging in as front_desk ===');
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('demo_role', 'front_desk');
    localStorage.setItem('demo_propertyId', '00000000-0000-4000-b000-000000000001');
  });
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(2000);

  // Check localStorage is set
  const demoRole = await page.evaluate(() => localStorage.getItem('demo_role'));
  const demoPid = await page.evaluate(() => localStorage.getItem('demo_propertyId'));
  console.log(`demo_role: ${demoRole}`);
  console.log(`demo_propertyId: ${demoPid}`);

  // Manually test the fetch
  console.log('\n=== Manual fetch test from browser context ===');
  const fetchResult = await page.evaluate(async () => {
    try {
      const role = localStorage.getItem('demo_role');
      const pid = localStorage.getItem('demo_propertyId') ?? '00000000-0000-4000-b000-000000000001';
      const url = `/api/v1/packages?propertyId=${pid}&pageSize=200`;
      console.log('Fetching:', url, 'with x-demo-role:', role);
      const resp = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'x-demo-role': role ?? 'front_desk',
        },
      });
      const text = await resp.text();
      return { status: resp.status, body: text.slice(0, 500), ok: resp.ok };
    } catch (e) {
      return { error: String(e) };
    }
  });
  console.log('Manual fetch result:', JSON.stringify(fetchResult, null, 2));

  // Now navigate to packages and observe
  console.log('\n=== Navigating to /packages ===');
  await page.goto(`${BASE_URL}/packages`);
  await page.waitForTimeout(5000);

  // Check DOM state
  const domState = await page.evaluate(() => {
    const spinners = document.querySelectorAll('.animate-spin');
    const loadingTexts = Array.from(document.querySelectorAll('p')).filter((el) =>
      el.textContent?.toLowerCase().includes('loading'),
    );
    const errorEls = Array.from(document.querySelectorAll('p')).filter((el) =>
      el.textContent?.toLowerCase().includes('failed'),
    );
    const tableRows = document.querySelectorAll('tbody tr').length;
    return {
      spinnerCount: spinners.length,
      loadingTexts: loadingTexts.map((el) => el.textContent),
      errorTexts: errorEls.map((el) => el.textContent),
      tableRowCount: tableRows,
    };
  });
  console.log('DOM state after 5s:', JSON.stringify(domState, null, 2));

  await page.screenshot({ path: path.join(DIR, 'packages-after-5s.png'), fullPage: true });

  // Write network log
  const logPath = path.join(DIR, 'network-log.json');
  fs.writeFileSync(logPath, JSON.stringify(networkLog, null, 2));
  console.log(`\nNetwork log saved to: ${logPath}`);
  console.log(`Screenshot saved to: ${DIR}/packages-after-5s.png`);

  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
