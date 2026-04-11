/**
 * Concierge — Manual Browser Test
 *
 * Opens Chrome and walks through every major page/flow:
 * login, dashboard (every role), packages, maintenance, amenities, security,
 * announcements, units, users, settings, reports, training, debug, search, etc.
 *
 * Takes screenshots of every state. Reports pass / fail / warn.
 */

import { chromium, type Page, type Browser } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(process.cwd(), 'test-results', 'manual-screenshots');
const DEFAULT_DEMO_PROPERTY_ID = '00000000-0000-4000-b000-000000000001';

// ---------------------------------------------------------------------------
// Infrastructure
// ---------------------------------------------------------------------------

fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const results: { page: string; status: 'pass' | 'fail' | 'warn'; note: string }[] = [];

async function ss(page: Page, name: string) {
  const file = path.join(SCREENSHOT_DIR, `${name.replace(/[^a-z0-9-]/gi, '_')}.png`);
  await page.screenshot({ path: file, fullPage: true });
}

function pass(pageName: string, note = '') {
  results.push({ page: pageName, status: 'pass', note });
  console.log(`  ✅  ${pageName}${note ? ` — ${note}` : ''}`);
}
function fail(pageName: string, note: string) {
  results.push({ page: pageName, status: 'fail', note });
  console.log(`  ❌  ${pageName} — ${note}`);
}
function warn(pageName: string, note: string) {
  results.push({ page: pageName, status: 'warn', note });
  console.log(`  ⚠️   ${pageName} — ${note}`);
}

// ---------------------------------------------------------------------------
// Demo login — sets localStorage and navigates directly
// ---------------------------------------------------------------------------

type DemoRole =
  | 'super_admin'
  | 'property_admin'
  | 'property_manager'
  | 'front_desk'
  | 'security_guard'
  | 'security_supervisor'
  | 'maintenance_staff'
  | 'superintendent'
  | 'resident_owner'
  | 'resident_tenant'
  | 'board_member';

async function loginAs(page: Page, role: DemoRole) {
  await page.goto(`${BASE_URL}/login`);
  await page.evaluate(
    ({ role, pid }) => {
      localStorage.clear();
      localStorage.setItem('demo_role', role);
      localStorage.setItem('demo_propertyId', pid);
    },
    { role, pid: DEFAULT_DEMO_PROPERTY_ID },
  );
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(2000);
}

// ---------------------------------------------------------------------------
// Check a page didn't land on an error screen
// ---------------------------------------------------------------------------

async function checkPageOk(page: Page, label: string): Promise<boolean> {
  const url = page.url();
  // Redirected to login → not authorized
  if (url.includes('/login')) {
    warn(label, `redirected to login (auth required or role blocked)`);
    return false;
  }
  // Error boundary content
  const bodyText = (
    await page
      .locator('body')
      .innerText()
      .catch(() => '')
  ).toLowerCase();
  if (
    bodyText.includes('application error') ||
    bodyText.includes('unhandled') ||
    (bodyText.includes('500') && bodyText.length < 500)
  ) {
    fail(label, 'error boundary / 500 page shown');
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// TEST SUITES
// ---------------------------------------------------------------------------

async function testLoginPage(page: Page) {
  console.log('\n── 1. Login Page ──────────────────────────────────────────');

  await page.goto(`${BASE_URL}/login`);
  await page.waitForTimeout(1500);
  await ss(page, '01-login-page');

  // Heading
  const heading = page.getByRole('heading', { name: /welcome back/i }).first();
  if (await heading.isVisible()) pass('Login / Heading', '"Welcome back" visible');
  else fail('Login / Heading', '"Welcome back" not found');

  // Email + password fields
  const email = page.locator('input[type="email"]').first();
  const password = page.locator('input[type="password"]').first();
  if (await email.isVisible()) pass('Login / Email field');
  else fail('Login / Email field', 'not found');
  if (await password.isVisible()) pass('Login / Password field');
  else fail('Login / Password field', 'not found');

  // Sign in button
  const signInBtn = page.getByRole('button', { name: /sign in/i }).first();
  if (await signInBtn.isVisible()) pass('Login / Sign In button');
  else fail('Login / Sign In button', 'not found');

  // Demo access buttons
  const demoLabels = [
    'Super Admin',
    'Property Admin',
    'Front Desk',
    'Security Guard',
    'Resident (Owner)',
  ];
  for (const label of demoLabels) {
    const btn = page.getByText(label, { exact: true }).first();
    if (await btn.isVisible()) pass(`Login / Demo button: ${label}`);
    else warn(`Login / Demo button: ${label}`, 'not found');
  }

  // Wrong credentials error
  await email.fill('wrong@example.com');
  await password.fill('wrongpassword');
  await signInBtn.click();
  await page.waitForTimeout(2500);
  await ss(page, '01-login-wrong-credentials');
  const errorEl = page.locator('[role="alert"]').first();
  if (await errorEl.isVisible()) pass('Login / Wrong credentials shows error');
  else warn('Login / Wrong credentials', 'no error alert shown');

  // Forgot password link
  await page.goto(`${BASE_URL}/login`);
  const forgotLink = page.getByRole('link', { name: /forgot password/i }).first();
  if (await forgotLink.isVisible()) {
    pass('Login / Forgot password link');
    await forgotLink.click();
    await page.waitForTimeout(1500);
    await ss(page, '01-login-forgot-password');
    if (page.url().includes('/forgot') || page.url().includes('/reset')) {
      pass('Login / Forgot password → page navigates');
    } else {
      warn('Login / Forgot password link', `URL stayed at ${page.url()}`);
    }
  } else {
    warn('Login / Forgot password link', 'not visible');
  }
}

async function testDashboardAllRoles(page: Page) {
  console.log('\n── 2. Dashboard — All Roles ───────────────────────────────');

  const roles: { role: DemoRole; label: string }[] = [
    { role: 'super_admin', label: 'Super Admin' },
    { role: 'property_admin', label: 'Property Admin' },
    { role: 'property_manager', label: 'Property Manager' },
    { role: 'front_desk', label: 'Front Desk' },
    { role: 'security_guard', label: 'Security Guard' },
    { role: 'maintenance_staff', label: 'Maintenance Staff' },
    { role: 'resident_owner', label: 'Resident (Owner)' },
    { role: 'board_member', label: 'Board Member' },
  ];

  for (const { role, label } of roles) {
    await loginAs(page, role);
    await ss(page, `02-dashboard-${role}`);
    const url = page.url();
    if (url.includes('/dashboard')) {
      const h1 = await page
        .locator('h1, h2')
        .first()
        .textContent()
        .catch(() => '?');
      pass(`Dashboard / ${label}`, `heading: "${h1?.trim()}"`);
    } else {
      fail(`Dashboard / ${label}`, `landed at ${url}`);
    }
  }
}

async function testPackages(page: Page) {
  console.log('\n── 3. Packages ────────────────────────────────────────────');

  await loginAs(page, 'front_desk');
  await page.goto(`${BASE_URL}/packages`);
  await page.waitForTimeout(2000);
  await ss(page, '03-packages-list');

  if (!(await checkPageOk(page, 'Packages / Page load'))) return;
  pass('Packages / Page load');

  // Table / card list
  const dataEl = page.locator('table, [class*="package"], [class*="card"]').first();
  if (await dataEl.isVisible()) pass('Packages / Data list visible');
  else warn('Packages / Data list', 'empty state or no table');

  // Log package button
  const logBtn = page.getByRole('button', { name: /log|add|new|record package/i }).first();
  if (await logBtn.isVisible()) {
    pass('Packages / Log Package button');
    await logBtn.click();
    await page.waitForTimeout(1500);
    await ss(page, '03-packages-log-form');
    const form = page.locator('form, [role="dialog"]').first();
    if (await form.isVisible()) {
      pass('Packages / Log form opens on click');

      // Check form fields
      const unitField = form.locator('input, select, [role="combobox"]').first();
      if (await unitField.isVisible()) pass('Packages / Form has input fields');

      // Close
      const closeBtn = page.getByRole('button', { name: /cancel|close/i }).first();
      if (await closeBtn.isVisible()) await closeBtn.click();
      else await page.keyboard.press('Escape');
    } else {
      warn('Packages / Log form', 'did not open after click');
    }
  } else {
    warn('Packages / Log Package button', 'not found');
  }

  // Filter/search (package-specific filter, not global search)
  const pkgSearch = page
    .locator('input[placeholder*="search" i][readonly!="true"], input[type="search"]')
    .first();
  if (await pkgSearch.isVisible()) {
    const isReadonly = await pkgSearch.getAttribute('readonly');
    if (!isReadonly) {
      pass('Packages / Search input visible');
      await pkgSearch.fill('101');
      await page.waitForTimeout(1000);
      await ss(page, '03-packages-filtered');
    } else {
      warn('Packages / Search', 'input is readonly (global search — tested separately)');
    }
  } else {
    warn('Packages / Search', 'no search input found');
  }
}

async function testMaintenance(page: Page) {
  console.log('\n── 4. Maintenance ─────────────────────────────────────────');

  await loginAs(page, 'property_manager');
  await page.goto(`${BASE_URL}/maintenance`);
  await page.waitForTimeout(2000);
  await ss(page, '04-maintenance-list');

  if (!(await checkPageOk(page, 'Maintenance / Page load'))) return;
  pass('Maintenance / Page load');

  const newBtn = page.getByRole('button', { name: /new|add|create|submit request/i }).first();
  if (await newBtn.isVisible()) {
    pass('Maintenance / New Request button');
    await newBtn.click();
    await page.waitForTimeout(1500);
    await ss(page, '04-maintenance-new-form');
    const form = page.locator('form, [role="dialog"]').first();
    if (await form.isVisible()) {
      pass('Maintenance / Form opens');
      // Try filling a field
      const titleInput = form.locator('input, textarea').first();
      if (await titleInput.isVisible()) {
        await titleInput.fill('Test maintenance request');
        pass('Maintenance / Can type in form');
      }
      const closeBtn = page.getByRole('button', { name: /cancel|close/i }).first();
      if (await closeBtn.isVisible()) await closeBtn.click();
      else await page.keyboard.press('Escape');
    } else {
      warn('Maintenance / Form', 'did not open');
    }
  } else {
    warn('Maintenance / New Request button', 'not found');
  }

  // Status filter tabs
  const tabs = page.getByRole('tab');
  const tabCount = await tabs.count();
  if (tabCount > 0) {
    pass('Maintenance / Status tabs', `${tabCount} tabs`);
    // Click a tab
    const tab = tabs.nth(1);
    if (await tab.isVisible()) {
      await tab.click();
      await page.waitForTimeout(800);
      await ss(page, '04-maintenance-tab2');
      pass('Maintenance / Tab click works');
    }
  } else {
    warn('Maintenance / Status tabs', 'no tabs found');
  }
}

async function testAmenities(page: Page) {
  console.log('\n── 5. Amenities ───────────────────────────────────────────');

  await loginAs(page, 'front_desk');
  await page.goto(`${BASE_URL}/amenities`);
  await page.waitForTimeout(2000);
  await ss(page, '05-amenities');

  if (!(await checkPageOk(page, 'Amenities / Page load'))) return;
  pass('Amenities / Page load');

  const bookBtn = page.getByRole('button', { name: /book|reserve|new booking/i }).first();
  if (await bookBtn.isVisible()) {
    pass('Amenities / Book button');
    await bookBtn.click();
    await page.waitForTimeout(1500);
    await ss(page, '05-amenities-booking-form');
    const form = page.locator('form, [role="dialog"]').first();
    if (await form.isVisible()) pass('Amenities / Booking form opens');
    else warn('Amenities / Booking form', 'did not open');
    const closeBtn = page.getByRole('button', { name: /cancel|close/i }).first();
    if (await closeBtn.isVisible()) await closeBtn.click();
    else await page.keyboard.press('Escape');
  } else {
    warn('Amenities / Book button', 'not found');
  }

  // View toggle (calendar / list)
  const calendarView = page.getByRole('button', { name: /calendar/i }).first();
  const listView = page.getByRole('button', { name: /list/i }).first();
  if (await calendarView.isVisible()) {
    pass('Amenities / Calendar view toggle');
    await calendarView.click();
    await page.waitForTimeout(800);
    await ss(page, '05-amenities-calendar-view');
  }
  if (await listView.isVisible()) {
    pass('Amenities / List view toggle');
    await listView.click();
    await page.waitForTimeout(800);
    await ss(page, '05-amenities-list-view');
  }
}

async function testSecurity(page: Page) {
  console.log('\n── 6. Security Console ────────────────────────────────────');

  await loginAs(page, 'security_guard');
  await page.goto(`${BASE_URL}/security`);
  await page.waitForTimeout(2000);
  await ss(page, '06-security');

  if (!(await checkPageOk(page, 'Security / Page load'))) return;
  pass('Security / Page load');

  // Check entry type tabs (packages, visitors, incidents, etc.)
  const tabs = page.getByRole('tab');
  const tabCount = await tabs.count();
  if (tabCount > 0) {
    pass('Security / Entry type tabs', `${tabCount} tabs`);
    // Click through a few tabs
    for (let i = 0; i < Math.min(tabCount, 4); i++) {
      const tab = tabs.nth(i);
      const tabText = await tab.textContent().catch(() => '');
      await tab.click();
      await page.waitForTimeout(600);
      pass(`Security / Tab: ${tabText?.trim()}`);
    }
    await ss(page, '06-security-tabs');
  } else {
    warn('Security / Tabs', 'no tab navigation found');
  }

  // Log incident button
  const logBtn = page.getByRole('button', { name: /log|add|new|incident|visitor/i }).first();
  if (await logBtn.isVisible()) {
    pass('Security / Log button');
    await logBtn.click();
    await page.waitForTimeout(1500);
    await ss(page, '06-security-log-form');
    const form = page.locator('form, [role="dialog"]').first();
    if (await form.isVisible()) pass('Security / Log form opens');
    else warn('Security / Log form', 'did not open');
    const closeBtn = page.getByRole('button', { name: /cancel|close/i }).first();
    if (await closeBtn.isVisible()) await closeBtn.click();
    else await page.keyboard.press('Escape');
  } else {
    warn('Security / Log button', 'not found');
  }
}

async function testAnnouncements(page: Page) {
  console.log('\n── 7. Announcements ───────────────────────────────────────');

  await loginAs(page, 'property_manager');
  await page.goto(`${BASE_URL}/announcements`);
  await page.waitForTimeout(2000);
  await ss(page, '07-announcements');

  if (!(await checkPageOk(page, 'Announcements / Page load'))) return;
  pass('Announcements / Page load');

  const newBtn = page.getByRole('button', { name: /new|create|compose|add/i }).first();
  if (await newBtn.isVisible()) {
    pass('Announcements / New button');
    await newBtn.click();
    await page.waitForTimeout(1500);
    await ss(page, '07-announcements-compose');
    const form = page.locator('form, [role="dialog"]').first();
    if (await form.isVisible()) {
      pass('Announcements / Compose form opens');
      const titleInput = form.locator('input').first();
      if (await titleInput.isVisible()) {
        await titleInput.fill('Test announcement title');
        pass('Announcements / Title field works');
      }
    } else {
      warn('Announcements / Compose form', 'did not open');
    }
    const closeBtn = page.getByRole('button', { name: /cancel|close/i }).first();
    if (await closeBtn.isVisible()) await closeBtn.click();
    else await page.keyboard.press('Escape');
  } else {
    warn('Announcements / New button', 'not found');
  }
}

async function testUnits(page: Page) {
  console.log('\n── 8. Units ───────────────────────────────────────────────');

  await loginAs(page, 'property_admin');
  await page.goto(`${BASE_URL}/units`);
  await page.waitForTimeout(2000);
  await ss(page, '08-units-list');

  if (!(await checkPageOk(page, 'Units / Page load'))) return;
  pass('Units / Page load');

  // Count unit rows
  const rows = page.locator('tr, [class*="unit-row"], [class*="unit-card"]');
  const rowCount = await rows.count();
  if (rowCount > 1) {
    pass('Units / Unit rows visible', `${rowCount} rows`);
    // Click first unit row to open detail
    await rows.nth(1).click();
    await page.waitForTimeout(1500);
    await ss(page, '08-units-detail');
    const url = page.url();
    if (url.includes('/units/')) {
      pass('Units / Unit detail navigates correctly', url);
      // Check for tabs on unit file
      const unitTabs = page.getByRole('tab');
      const unitTabCount = await unitTabs.count();
      if (unitTabCount > 0) {
        pass(`Units / Unit file has tabs`, `${unitTabCount} tabs`);
        for (let i = 0; i < Math.min(unitTabCount, 4); i++) {
          const tab = unitTabs.nth(i);
          const label = await tab.textContent().catch(() => '');
          await tab.click();
          await page.waitForTimeout(600);
          pass(`Units / Tab "${label?.trim()}" clickable`);
        }
        await ss(page, '08-units-detail-tabs');
      }
    } else {
      warn('Units / Detail navigation', `stayed at ${url}`);
    }
  } else {
    warn('Units / Rows', 'no unit rows found — possible empty state');
  }
}

async function testUsers(page: Page) {
  console.log('\n── 9. Users / Residents ───────────────────────────────────');

  await loginAs(page, 'property_admin');
  await page.goto(`${BASE_URL}/users`);
  await page.waitForTimeout(2000);
  await ss(page, '09-users-list');

  if (!(await checkPageOk(page, 'Users / Page load'))) return;
  pass('Users / Page load');

  const inviteBtn = page.getByRole('button', { name: /invite|add user|new user|create/i }).first();
  if (await inviteBtn.isVisible()) {
    pass('Users / Invite/Add button');
    await inviteBtn.click();
    await page.waitForTimeout(1500);
    await ss(page, '09-users-invite-form');
    const form = page.locator('form, [role="dialog"]').first();
    if (await form.isVisible()) {
      pass('Users / Invite form opens');
      // Fill fields
      const firstNameInput = form.locator('input').first();
      if (await firstNameInput.isVisible()) {
        await firstNameInput.fill('Test');
        pass('Users / Invite form accepts input');
      }
    } else {
      warn('Users / Invite form', 'did not open');
    }
    const closeBtn = page.getByRole('button', { name: /cancel|close/i }).first();
    if (await closeBtn.isVisible()) await closeBtn.click();
    else await page.keyboard.press('Escape');
  } else {
    warn('Users / Invite button', 'not found');
  }

  // Search/filter
  const searchInput = page.locator('input[placeholder*="search" i]').first();
  if (await searchInput.isVisible()) {
    pass('Users / Search input');
    await searchInput.fill('john');
    await page.waitForTimeout(1000);
    await ss(page, '09-users-search');
  }
}

async function testSettings(page: Page) {
  console.log('\n── 10. Settings ───────────────────────────────────────────');

  await loginAs(page, 'property_admin');
  await page.goto(`${BASE_URL}/settings`);
  await page.waitForTimeout(2000);
  await ss(page, '10-settings');

  if (!(await checkPageOk(page, 'Settings / Page load'))) return;
  pass('Settings / Page load');

  const tabs = page.getByRole('tab');
  const tabCount = await tabs.count();
  if (tabCount > 0) {
    pass('Settings / Has tabs', `${tabCount} tabs`);
    for (let i = 0; i < Math.min(tabCount, 6); i++) {
      const tab = tabs.nth(i);
      const label = await tab.textContent().catch(() => '');
      await tab.click();
      await page.waitForTimeout(600);
      await ss(page, `10-settings-tab-${i}`);
      pass(`Settings / Tab "${label?.trim()}" clickable`);
    }
  } else {
    // Might use sidebar nav instead of tabs
    const settingsNav = page.locator('nav a, [class*="settings-nav"] a').all();
    const navLinks = await settingsNav;
    if (navLinks.length > 0) pass('Settings / Settings nav items', `${navLinks.length}`);
    else warn('Settings / Navigation', 'no tabs or nav items found');
  }
}

async function testReports(page: Page) {
  console.log('\n── 11. Reports ────────────────────────────────────────────');

  await loginAs(page, 'property_admin');
  await page.goto(`${BASE_URL}/reports`);
  await page.waitForTimeout(2000);
  await ss(page, '11-reports');

  if (!(await checkPageOk(page, 'Reports / Page load'))) return;
  pass('Reports / Page load');

  const generateBtn = page.getByRole('button', { name: /generate|export|run/i }).first();
  const reportSelect = page.locator('select, [role="combobox"]').first();

  if (await reportSelect.isVisible()) {
    pass('Reports / Report type selector');
    // Try selecting a report type
    await reportSelect.click();
    await page.waitForTimeout(500);
    await ss(page, '11-reports-selector-open');
    // Pick second option
    const option = page.locator('[role="option"]').nth(1);
    if (await option.isVisible()) {
      await option.click();
      pass('Reports / Can select report type');
    }
  }

  if (await generateBtn.isVisible()) {
    pass('Reports / Generate button');
    await generateBtn.click();
    await page.waitForTimeout(2000);
    await ss(page, '11-reports-generated');
    const report = page.locator('table, [class*="report"], canvas').first();
    if (await report.isVisible()) pass('Reports / Report output shown');
    else warn('Reports / Output', 'no visible report output after generate');
  } else {
    warn('Reports / Generate button', 'not found');
  }
}

async function testTraining(page: Page) {
  console.log('\n── 12. Training / LMS ─────────────────────────────────────');

  await loginAs(page, 'front_desk');
  await page.goto(`${BASE_URL}/training`);
  await page.waitForTimeout(2000);
  await ss(page, '12-training');

  if (!(await checkPageOk(page, 'Training / Page load'))) return;
  pass('Training / Page load');

  const courseCard = page.locator('[class*="course"], [class*="card"], [class*="module"]').first();
  if (await courseCard.isVisible()) {
    pass('Training / Course cards visible');
    await courseCard.click();
    await page.waitForTimeout(1500);
    await ss(page, '12-training-course-detail');
    const url = page.url();
    if (url.includes('/training/')) pass('Training / Course detail navigation');
    else warn('Training / Course click', `stayed at ${url}`);
  } else {
    warn('Training / Courses', 'no course cards found — possible empty state');
  }
}

async function testDebugDashboard(page: Page) {
  console.log('\n── 13. Debug Intelligence Dashboard ──────────────────────');

  await loginAs(page, 'super_admin');
  await page.goto(`${BASE_URL}/system/debug`);
  await page.waitForTimeout(2000);
  await ss(page, '13-debug-dashboard');

  const url = page.url();
  if (url.includes('/system/debug')) {
    pass('Debug Dashboard / Accessible to super_admin');
    const heading = await page
      .locator('h1, h2')
      .first()
      .textContent()
      .catch(() => '');
    pass('Debug Dashboard / Heading', `"${heading?.trim()}"`);

    // Check for events table/list
    const events = page.locator('table, [class*="event"], [class*="list"]').first();
    if (await events.isVisible()) pass('Debug Dashboard / Events list visible');
    else warn('Debug Dashboard / Events list', 'empty or not found');

    // Check filter controls
    const filterBtn = page.getByRole('button', { name: /filter|severity|status/i }).first();
    if (await filterBtn.isVisible()) pass('Debug Dashboard / Filter controls present');

    // Bug report button in sidebar nav
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForTimeout(1000);
    const debugNavLink = page.getByText('Debug Intelligence', { exact: false }).first();
    if (await debugNavLink.isVisible()) pass('Debug Dashboard / Nav link in sidebar');
    else warn('Debug Dashboard / Nav link', 'not visible in sidebar (may be in System section)');
  } else if (url.includes('/login')) {
    fail('Debug Dashboard / Access', 'super_admin redirected to login');
  } else {
    fail('Debug Dashboard / Page', `loaded wrong URL: ${url}`);
  }
}

async function testFloatingBugButton(page: Page) {
  console.log('\n── 14. Floating Bug Button ────────────────────────────────');

  await loginAs(page, 'front_desk');
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(1500);

  // Look for the fixed bottom-right bug button
  const bugBtn = page.locator('button[title*="bug" i], button[title*="Report" i]').first();
  if (await bugBtn.isVisible()) {
    pass('Bug Button / Visible on dashboard');
    await bugBtn.click();
    await page.waitForTimeout(800);
    await ss(page, '14-bug-button-modal');
    const modal = page.locator('[role="dialog"]').first();
    if (await modal.isVisible()) {
      pass('Bug Button / Modal opens on click');
      // Check modal contents
      const textarea = modal.locator('textarea').first();
      if (await textarea.isVisible()) {
        pass('Bug Button / Textarea visible');
        await textarea.fill('This is a test bug report from the automated browser test');
      }
      const submitBtn = modal.getByRole('button', { name: /submit/i }).first();
      if (await submitBtn.isVisible()) pass('Bug Button / Submit button in modal');
      await page.keyboard.press('Escape');
    } else {
      warn('Bug Button / Modal', 'did not open after click');
    }
  } else {
    // Try keyboard shortcut
    await page.keyboard.press('Shift+D');
    await page.waitForTimeout(600);
    const modal = page.locator('[role="dialog"]').first();
    if (await modal.isVisible()) {
      pass('Bug Button / Shift+D opens modal');
      await ss(page, '14-bug-button-shiftd');
      await page.keyboard.press('Escape');
    } else {
      warn('Bug Button', 'not visible and Shift+D did not open it');
    }
  }
}

async function testNavigation(page: Page) {
  console.log('\n── 15. Sidebar Navigation ─────────────────────────────────');

  await loginAs(page, 'property_admin');
  await page.waitForTimeout(1000);

  const allNavLinks = await page.locator('nav a, aside a').all();
  console.log(`   Found ${allNavLinks.length} nav links for property_admin`);

  const visited = new Set<string>();
  let navPass = 0,
    navFail = 0;

  for (const link of allNavLinks) {
    const href = await link.getAttribute('href').catch(() => null);
    if (!href || visited.has(href) || href.startsWith('http') || href === '#') continue;
    visited.add(href);

    try {
      const label = await link.textContent().catch(() => href);
      await link.click({ timeout: 5000 });
      await page.waitForTimeout(1000);
      const finalUrl = page.url();
      const bodyText = (
        await page
          .locator('body')
          .innerText()
          .catch(() => '')
      ).toLowerCase();
      if (
        bodyText.includes('application error') ||
        (bodyText.includes('500') && bodyText.length < 300)
      ) {
        fail(`Nav → ${label?.trim() || href}`, `error page at ${finalUrl}`);
        navFail++;
      } else if (finalUrl.includes('/login')) {
        warn(`Nav → ${label?.trim() || href}`, 'redirected to login');
        navFail++;
        // Re-login
        await loginAs(page, 'property_admin');
      } else {
        pass(`Nav → ${label?.trim() || href}`);
        navPass++;
      }
    } catch (e) {
      fail(`Nav → ${href}`, String(e).slice(0, 80));
      navFail++;
    }
  }

  await ss(page, '15-nav-last-page');
  console.log(`   Result: ${navPass} pass, ${navFail} fail`);
}

async function testSearch(page: Page) {
  console.log('\n── 16. Global Search ──────────────────────────────────────');

  await loginAs(page, 'front_desk');
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForTimeout(1500);

  // Try Cmd+K
  await page.keyboard.press('Meta+k');
  await page.waitForTimeout(800);
  await ss(page, '16-search-cmdk');

  const cmdPalette = page.locator('[role="dialog"], [class*="command"], [class*="search"]').first();
  if (await cmdPalette.isVisible()) {
    pass('Search / Cmd+K opens search palette');
    const searchInput = cmdPalette.locator('input').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('package');
      await page.waitForTimeout(1000);
      await ss(page, '16-search-results');
      const results = page.locator('[role="option"], [class*="result"]').first();
      if (await results.isVisible()) pass('Search / Results appear for "package"');
      else warn('Search / Results', 'no results shown');
    }
    await page.keyboard.press('Escape');
  } else {
    // Try top bar search input
    const searchBar = page.locator('input[placeholder*="search" i], [type="search"]').first();
    if (await searchBar.isVisible()) {
      pass('Search / Search bar visible');
      await searchBar.fill('unit 101');
      await page.waitForTimeout(1000);
      await ss(page, '16-search-bar-results');
    } else {
      warn('Search', 'no Cmd+K palette or search bar found');
    }
  }
}

async function testResidentPortal(page: Page) {
  console.log('\n── 17. Resident Portal ────────────────────────────────────');

  await loginAs(page, 'resident_owner');
  const url = page.url();
  await ss(page, '17-resident-dashboard');

  if (url.includes('/dashboard')) {
    pass('Resident Portal / Dashboard accessible');
    const h1 = await page
      .locator('h1, h2')
      .first()
      .textContent()
      .catch(() => '?');
    pass('Resident Portal / Heading', `"${h1?.trim()}"`);
  } else {
    fail('Resident Portal / Dashboard', `landed at ${url}`);
    return;
  }

  // Check resident can access their packages
  const packageLink = page.getByRole('link', { name: /package/i }).first();
  if (await packageLink.isVisible()) {
    await packageLink.click();
    await page.waitForTimeout(1500);
    await ss(page, '17-resident-packages');
    if (page.url().includes('/packages')) pass('Resident Portal / Packages accessible');
    else warn('Resident Portal / Packages', `at ${page.url()}`);
  }

  // Check resident can access maintenance
  await loginAs(page, 'resident_owner');
  const maintLink = page.getByRole('link', { name: /maintenance/i }).first();
  if (await maintLink.isVisible()) {
    await maintLink.click();
    await page.waitForTimeout(1500);
    await ss(page, '17-resident-maintenance');
    pass('Resident Portal / Maintenance accessible');
  }

  // Verify resident can't access admin areas
  await page.goto(`${BASE_URL}/users`);
  await page.waitForTimeout(1500);
  await ss(page, '17-resident-users-blocked');
  const blockedUrl = page.url();
  if (!blockedUrl.includes('/users') || blockedUrl.includes('/login')) {
    pass('Resident Portal / Blocked from /users (correct RBAC)');
  } else {
    fail('Resident Portal / RBAC', 'resident can access /users — security issue!');
  }
}

async function testSystemRoutes(page: Page) {
  console.log('\n── 18. System Routes ──────────────────────────────────────');

  await loginAs(page, 'super_admin');

  const systemRoutes = [
    { path: '/system/demo', label: 'Demo Environment' },
    { path: '/system/debug', label: 'Debug Intelligence' },
    { path: '/system/billing', label: 'Billing' },
    { path: '/system/audit', label: 'Audit Logs' },
    { path: '/onboarding', label: 'Onboarding Wizard' },
  ];

  for (const route of systemRoutes) {
    await page.goto(`${BASE_URL}${route.path}`);
    await page.waitForTimeout(1500);
    await ss(page, `18-system${route.path.replace(/\//g, '-')}`);
    const url = page.url();
    if (url.includes('/login')) {
      warn(`System / ${route.label}`, 'redirected to login');
    } else if (url.includes(route.path)) {
      pass(`System / ${route.label}`, 'accessible');
    } else {
      warn(`System / ${route.label}`, `redirected to ${url}`);
    }
  }
}

async function test404(page: Page) {
  console.log('\n── 19. 404 / Error Pages ──────────────────────────────────');

  await page.goto(`${BASE_URL}/this-page-does-not-exist-xyz-123`);
  await page.waitForTimeout(1000);
  await ss(page, '19-404-page');

  const bodyText = (await page.locator('body').innerText()).toLowerCase();
  if (
    bodyText.includes('404') ||
    bodyText.includes('not found') ||
    bodyText.includes('page not found')
  ) {
    pass('404 / Shows 404 page content');
  } else if (page.url().includes('/login')) {
    warn('404 / Behavior', 'redirected to login instead of showing 404');
  } else {
    warn('404 / Behavior', 'page loaded without 404 indicator');
  }
}

// ---------------------------------------------------------------------------
// Main runner
// ---------------------------------------------------------------------------

async function run() {
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: false,
      channel: 'chrome',
      args: ['--window-size=1920,1080', '--start-maximized'],
    });

    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  Concierge — Manual Browser Test (Chrome 1920×1080)');
    console.log('  ' + new Date().toLocaleString());
    console.log('═══════════════════════════════════════════════════════════════');

    const suites = [
      testLoginPage,
      testDashboardAllRoles,
      testPackages,
      testMaintenance,
      testAmenities,
      testSecurity,
      testAnnouncements,
      testUnits,
      testUsers,
      testSettings,
      testReports,
      testTraining,
      testDebugDashboard,
      testFloatingBugButton,
      testNavigation,
      testSearch,
      testResidentPortal,
      testSystemRoutes,
      test404,
    ];

    for (const suite of suites) {
      try {
        await suite(page);
      } catch (e) {
        fail(`Suite crash: ${suite.name}`, String(e).slice(0, 200));
        // Try to recover and continue
        try {
          await page.goto(`${BASE_URL}/dashboard`);
        } catch {}
      }
    }

    // ─── Final Report ───────────────────────────────────────────────────────
    const passed = results.filter((r) => r.status === 'pass').length;
    const failed = results.filter((r) => r.status === 'fail').length;
    const warned = results.filter((r) => r.status === 'warn').length;

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log(`  RESULTS:  ${passed} ✅ pass   ${failed} ❌ fail   ${warned} ⚠️  warn`);
    console.log('═══════════════════════════════════════════════════════════════');

    if (failed > 0) {
      console.log('\n── FAILURES ───────────────────────────────────────────────────');
      results
        .filter((r) => r.status === 'fail')
        .forEach((r) => {
          console.log(`  ❌  [${r.page}]: ${r.note}`);
        });
    }

    if (warned > 0) {
      console.log('\n── WARNINGS ───────────────────────────────────────────────────');
      results
        .filter((r) => r.status === 'warn')
        .forEach((r) => {
          console.log(`  ⚠️   [${r.page}]: ${r.note}`);
        });
    }

    console.log(`\n  Screenshots: ${SCREENSHOT_DIR}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    fs.writeFileSync(
      path.join(SCREENSHOT_DIR, 'results.json'),
      JSON.stringify(
        { summary: { passed, failed, warned }, timestamp: new Date().toISOString(), results },
        null,
        2,
      ),
    );

    await context.close();
  } finally {
    if (browser) await browser.close();
  }
}

run().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
