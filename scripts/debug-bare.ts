/**
 * Bare test — no route interception, just plain browser navigation
 */
import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const DIR = path.join(process.cwd(), 'test-results', 'debug-bare');
fs.mkdirSync(DIR, { recursive: true });

async function run() {
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome',
    args: ['--window-size=1400,900'],
  });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();

  // Capture console messages
  page.on('console', (msg) => {
    if (msg.type() !== 'info') console.log(`[console.${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => console.log(`[PAGE ERROR] ${err.message}`));

  // Capture network responses via CDP (no interception)
  const client = await ctx.newCDPSession(page);
  await client.send('Network.enable');
  const networkEvents: Array<{ url: string; status: number; timing: number }> = [];
  const pendingReqs: Map<string, number> = new Map();

  client.on('Network.requestWillBeSent', (params) => {
    if (params.request.url.includes('/api/')) {
      pendingReqs.set(params.requestId, Date.now());
      console.log(`→ [${params.request.method}] ${params.request.url}`);
    }
  });

  client.on('Network.responseReceived', (params) => {
    if (params.response.url.includes('/api/')) {
      const start = pendingReqs.get(params.requestId) ?? Date.now();
      const timing = Date.now() - start;
      networkEvents.push({ url: params.response.url, status: params.response.status, timing });
      pendingReqs.delete(params.requestId);
      console.log(`← [${params.response.status}] ${params.response.url} (${timing}ms)`);
    }
  });

  client.on('Network.loadingFailed', (params) => {
    if (pendingReqs.has(params.requestId)) {
      console.log(`✗ [FAILED] requestId=${params.requestId}: ${params.errorText}`);
      pendingReqs.delete(params.requestId);
    }
  });

  // Login
  console.log('\n=== Login as front_desk ===');
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('demo_role', 'front_desk');
    localStorage.setItem('demo_propertyId', '00000000-0000-4000-b000-000000000001');
  });
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(2000);

  const ls = await page.evaluate(() => ({
    role: localStorage.getItem('demo_role'),
    pid: localStorage.getItem('demo_propertyId'),
  }));
  console.log('localStorage:', ls);

  // Navigate to packages
  console.log('\n=== Navigate to /packages ===');
  await page.goto(`${BASE_URL}/packages`);

  // Poll DOM state every second for 10 seconds
  for (let i = 1; i <= 10; i++) {
    await page.waitForTimeout(1000);
    const state = await page.evaluate(() => {
      const spinners = document.querySelectorAll('.animate-spin').length;
      const loadingP = Array.from(document.querySelectorAll('p')).filter((el) =>
        el.textContent?.toLowerCase().includes('loading'),
      ).length;
      const rows = document.querySelectorAll('tbody tr').length;
      const errorP = Array.from(document.querySelectorAll('p'))
        .filter(
          (el) =>
            el.textContent?.toLowerCase().includes('failed') ||
            el.textContent?.toLowerCase().includes('error') ||
            el.textContent?.toLowerCase().includes('network'),
        )
        .map((el) => el.textContent?.trim().slice(0, 100));
      const localRole = localStorage.getItem('demo_role');
      return { spinners, loadingP, rows, errorP, localRole };
    });
    console.log(
      `[t+${i}s] spinners=${state.spinners} loadingP=${state.loadingP} rows=${state.rows} role=${state.localRole}`,
      state.errorP.length ? state.errorP : '',
    );

    if (state.rows > 0 || (state.spinners === 0 && state.loadingP === 0)) {
      console.log('✓ Page loaded!');
      break;
    }
  }

  await page.screenshot({ path: path.join(DIR, 'packages.png'), fullPage: true });
  console.log(`\nScreenshot: ${DIR}/packages.png`);

  // Check pending requests that never got a response
  if (pendingReqs.size > 0) {
    console.log('\n⚠ Requests still pending (never got response):');
    for (const [reqId, startTime] of pendingReqs) {
      console.log(`  requestId=${reqId} (${Date.now() - startTime}ms ago)`);
    }
  }

  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
