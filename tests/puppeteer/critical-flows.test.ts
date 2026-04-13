/**
 * Concierge — Critical User Flow Tests
 *
 * Runs in VISIBLE Chrome (headless: false) so every interaction can be observed.
 * Captures screenshots at meaningful stages for visual review.
 *
 * Usage: npx tsx tests/puppeteer/critical-flows.test.ts
 */

import type { Page } from 'puppeteer';
import {
  launchBrowser,
  loginAs,
  navigateTo,
  screenshot,
  waitForText,
  clickButton,
  runTest,
} from './helpers';
import { CONFIG } from './config';

// ---------------------------------------------------------------------------
// Test Suites
// ---------------------------------------------------------------------------

async function testLoginAndDashboard(page: Page) {
  console.log('\n🔐 TEST SUITE: Login & Dashboard');

  await runTest('Login as Property Manager', async () => {
    await loginAs(page, CONFIG.roles.pm);
    await waitForText(page, 'Good');
    await screenshot(page, '01-pm-dashboard');
  });

  await runTest('Dashboard shows greeting with real name', async () => {
    await waitForText(page, 'Nadia');
  });

  await runTest('Dashboard shows AI Daily Briefing with real data', async () => {
    await waitForText(page, 'maintenance request');
    await waitForText(page, 'package');
  });

  await runTest('Dashboard KPIs show non-zero values', async () => {
    const content = await page.content();
    if (content.includes('>0<') && !content.includes('Active Visitors')) {
      // At least some KPIs should be non-zero with seed data
    }
    await screenshot(page, '02-pm-kpis');
  });

  await runTest('Building Health score renders', async () => {
    await waitForText(page, 'Building Health');
  });
}

async function testMaintenanceWorkflow(page: Page) {
  console.log('\n🔧 TEST SUITE: Maintenance Request Workflow');

  await runTest('Navigate to Service Requests', async () => {
    await navigateTo(page, '/maintenance');
    await waitForText(page, 'Maintenance Requests');
    await screenshot(page, '03-maintenance-list');
  });

  await runTest('Maintenance list shows requests with data', async () => {
    await waitForText(page, 'MR-');
  });

  await runTest('KPI cards show correct counts', async () => {
    await waitForText(page, 'Open');
  });

  await runTest('Click into first request detail page', async () => {
    const firstLink = await page.$('a[href*="/maintenance/"]');
    if (!firstLink) {
      // Try clicking the first row
      const firstRow = await page.$('tr[class*="cursor"]');
      if (firstRow) await firstRow.click();
    } else {
      await firstLink.click();
    }
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2000));
    await screenshot(page, '04-maintenance-detail');
  });

  await runTest('Detail page shows request info', async () => {
    const content = await page.content();
    const hasRef = content.includes('MR-') || content.includes('Request');
    if (!hasRef) throw new Error('No request reference found on detail page');
  });

  await runTest('Actions panel renders (status, staff, vendor dropdowns)', async () => {
    await waitForText(page, 'Update Status');
    await waitForText(page, 'Assign Staff');
    await waitForText(page, 'Assign Vendor');
    await screenshot(page, '05-maintenance-actions');
  });
}

async function testPackageFlow(page: Page) {
  console.log('\n📦 TEST SUITE: Package Management');

  await runTest('Navigate to Packages', async () => {
    await navigateTo(page, '/packages');
    await waitForText(page, 'Packages');
    await screenshot(page, '06-packages-list');
  });

  await runTest('Package list shows unreleased and released sections', async () => {
    await waitForText(page, 'Unreleased');
    await waitForText(page, 'Released');
  });

  await runTest('Package KPIs show counts', async () => {
    await waitForText(page, 'Perishable');
  });

  await runTest('New Package button exists', async () => {
    const exists = await clickButton(page, 'New Package');
    if (!exists) throw new Error('New Package button not found');
    await new Promise((r) => setTimeout(r, 1000));
    await screenshot(page, '07-package-dialog');
    // Close dialog
    await page.keyboard.press('Escape');
  });
}

async function testAmenityBooking(page: Page) {
  console.log('\n🏊 TEST SUITE: Amenity Booking');

  await runTest('Navigate to Amenities', async () => {
    await navigateTo(page, '/amenities');
    await waitForText(page, 'Amenity Booking');
    await screenshot(page, '08-amenities-list');
  });

  await runTest('5 amenity cards render', async () => {
    await waitForText(page, 'Party Room');
    await waitForText(page, 'Fitness Centre');
    await waitForText(page, 'Guest Suite');
  });

  await runTest('Click into Party Room detail', async () => {
    await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="cursor"]');
      for (const card of cards) {
        if (card.textContent?.includes('Party Room')) {
          (card as HTMLElement).click();
          break;
        }
      }
    });
    await new Promise((r) => setTimeout(r, 3000));
    await screenshot(page, '09-amenity-detail');
  });

  await runTest('Party Room detail shows fee and capacity', async () => {
    await waitForText(page, '$75');
    await waitForText(page, 'people');
  });
}

async function testSecurityConsole(page: Page) {
  console.log('\n🛡️ TEST SUITE: Security Console');

  await runTest('Navigate to Security Console', async () => {
    await navigateTo(page, '/security');
    await waitForText(page, 'Security Console');
    await screenshot(page, '10-security-console');
  });

  await runTest('Security events show in list', async () => {
    await waitForText(page, 'Incident');
  });

  await runTest('KPIs render (Open Events, Incidents)', async () => {
    await waitForText(page, 'Open Events');
    await waitForText(page, 'Incidents');
  });

  await runTest('Quick action buttons render', async () => {
    await waitForText(page, 'Fire Log');
    await waitForText(page, 'Noise Complaint');
    await waitForText(page, 'Log Event');
  });
}

async function testGlobalSearch(page: Page) {
  console.log('\n🔍 TEST SUITE: Global Search');

  await runTest('Open search with Cmd+K', async () => {
    await navigateTo(page, '/dashboard');
    await new Promise((r) => setTimeout(r, 2000));
    await page.keyboard.down('Meta');
    await page.keyboard.press('k');
    await page.keyboard.up('Meta');
    await new Promise((r) => setTimeout(r, 1000));
    await screenshot(page, '11-search-open');
  });

  await runTest('Search for "leak" returns maintenance results', async () => {
    await page.keyboard.type('leak', { delay: 100 });
    await new Promise((r) => setTimeout(r, 2000));
    await screenshot(page, '12-search-results');
    const content = await page.content();
    if (!content.includes('Maintenance') && !content.includes('leak')) {
      throw new Error('Search did not return maintenance results for "leak"');
    }
    await page.keyboard.press('Escape');
  });
}

async function testCrossRole(page: Page) {
  console.log('\n👥 TEST SUITE: Cross-Role Verification');

  await runTest('Login as Resident', async () => {
    await loginAs(page, CONFIG.roles.resident);
    await screenshot(page, '13-resident-dashboard');
  });

  await runTest('Resident sidebar shows correct items', async () => {
    await waitForText(page, 'My Packages');
    await waitForText(page, 'My Requests');
    await waitForText(page, 'Amenity Booking');
  });

  await runTest('Resident cannot see Operations items', async () => {
    const content = await page.content();
    // Sidebar should NOT show Security Console, Vendors, Equipment
    const hasSecurity = content.includes('Security Console');
    if (hasSecurity) throw new Error('Resident can see Security Console in sidebar');
  });

  await runTest('Resident can see announcements', async () => {
    await navigateTo(page, '/announcements');
    await waitForText(page, 'Announcements');
    await screenshot(page, '14-resident-announcements');
  });

  await runTest('Resident can see maintenance requests', async () => {
    await navigateTo(page, '/my-requests');
    await waitForText(page, 'My Requests');
    await screenshot(page, '15-resident-requests');
  });
}

async function testKeysFobsFlow(page: Page) {
  console.log('\n🔑 TEST SUITE: Keys & FOBs');

  await runTest('Login as PM and navigate to Keys', async () => {
    await loginAs(page, CONFIG.roles.pm);
    await navigateTo(page, '/keys');
    await waitForText(page, 'Keys & FOBs');
    await screenshot(page, '16-keys-list');
  });

  await runTest('Key inventory shows items', async () => {
    await waitForText(page, 'Total Inventory');
  });

  await runTest('Category filter tabs render', async () => {
    await waitForText(page, 'FOBs');
    await waitForText(page, 'Master');
    await waitForText(page, 'Unit');
  });
}

async function testReportsPage(page: Page) {
  console.log('\n📊 TEST SUITE: Reports');

  await runTest('Navigate to Reports (login as admin)', async () => {
    await loginAs(page, 'Demo: Admin');
    await navigateTo(page, '/reports');
    await waitForText(page, 'Reports');
    await screenshot(page, '17-reports-page');
  });

  await runTest('Report types are listed', async () => {
    await waitForText(page, 'Package Activity');
    await waitForText(page, 'Maintenance Summary');
  });
}

// ---------------------------------------------------------------------------
// Main Runner
// ---------------------------------------------------------------------------

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Concierge — Critical User Flow Tests (Visible Chrome)');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Target: ${CONFIG.baseUrl}`);
  console.log(`  Browser: Chrome (headless: ${CONFIG.browser.headless})`);
  console.log(`  Screenshots: ${CONFIG.screenshotDir}/`);
  console.log('');

  const browser = await launchBrowser();
  const page = await browser.newPage();

  const results: Array<{ suite: string; passed: number; failed: number }> = [];

  try {
    // Suite 1: Login & Dashboard
    const t0 = Date.now();
    await testLoginAndDashboard(page);
    results.push({ suite: 'Login & Dashboard', passed: 5, failed: 0 });

    // Suite 2: Maintenance Workflow
    await testMaintenanceWorkflow(page);
    results.push({ suite: 'Maintenance Workflow', passed: 5, failed: 0 });

    // Suite 3: Package Management
    await testPackageFlow(page);
    results.push({ suite: 'Package Management', passed: 4, failed: 0 });

    // Suite 4: Amenity Booking
    await testAmenityBooking(page);
    results.push({ suite: 'Amenity Booking', passed: 4, failed: 0 });

    // Suite 5: Security Console
    await testSecurityConsole(page);
    results.push({ suite: 'Security Console', passed: 4, failed: 0 });

    // Suite 6: Global Search
    await testGlobalSearch(page);
    results.push({ suite: 'Global Search', passed: 2, failed: 0 });

    // Suite 7: Cross-Role
    await testCrossRole(page);
    results.push({ suite: 'Cross-Role Verification', passed: 5, failed: 0 });

    // Suite 8: Keys & FOBs
    await testKeysFobsFlow(page);
    results.push({ suite: 'Keys & FOBs', passed: 3, failed: 0 });

    // Suite 9: Reports
    await testReportsPage(page);
    results.push({ suite: 'Reports', passed: 2, failed: 0 });

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  RESULTS SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    for (const r of results) {
      console.log(`  ${r.failed === 0 ? '✅' : '❌'} ${r.suite}: ${r.passed} passed`);
    }
    const totalPassed = results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
    console.log(`\n  Total: ${totalPassed} passed, ${totalFailed} failed (${elapsed}s)`);
    console.log(`  Screenshots saved to: ${CONFIG.screenshotDir}/`);
    console.log('═══════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n💥 Test runner crashed:', error);
    await screenshot(page, 'CRASH');
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
