/**
 * Concierge — Playwright Auth Fixture
 *
 * Provides pre-authenticated browser contexts for E2E tests.
 * Extends Playwright's base test with auth fixtures for each role,
 * so tests can run as any user without manual login flows.
 *
 * @module tests/e2e/fixtures/auth
 */

import { test as base, type Page, type BrowserContext } from '@playwright/test';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RoleName =
  | 'superAdmin'
  | 'propertyAdmin'
  | 'propertyManager'
  | 'frontDesk'
  | 'securityGuard'
  | 'maintenanceStaff'
  | 'boardMember'
  | 'residentOwner'
  | 'residentTenant';

interface AuthFixtures {
  /** Browser context pre-authenticated as a Super Admin */
  superAdminContext: BrowserContext;
  /** Page pre-authenticated as a Super Admin */
  superAdminPage: Page;

  /** Browser context pre-authenticated as a Property Admin */
  propertyAdminContext: BrowserContext;
  /** Page pre-authenticated as a Property Admin */
  propertyAdminPage: Page;

  /** Browser context pre-authenticated as a Property Manager */
  propertyManagerContext: BrowserContext;
  /** Page pre-authenticated as a Property Manager */
  propertyManagerPage: Page;

  /** Browser context pre-authenticated as Front Desk / Concierge */
  frontDeskContext: BrowserContext;
  /** Page pre-authenticated as Front Desk / Concierge */
  frontDeskPage: Page;

  /** Browser context pre-authenticated as a Security Guard */
  securityGuardContext: BrowserContext;
  /** Page pre-authenticated as a Security Guard */
  securityGuardPage: Page;

  /** Browser context pre-authenticated as Maintenance Staff */
  maintenanceStaffContext: BrowserContext;
  /** Page pre-authenticated as Maintenance Staff */
  maintenanceStaffPage: Page;

  /** Browser context pre-authenticated as a Board Member */
  boardMemberContext: BrowserContext;
  /** Page pre-authenticated as a Board Member */
  boardMemberPage: Page;

  /** Browser context pre-authenticated as a Resident Owner */
  residentOwnerContext: BrowserContext;
  /** Page pre-authenticated as a Resident Owner */
  residentOwnerPage: Page;

  /** Browser context pre-authenticated as a Resident Tenant */
  residentTenantContext: BrowserContext;
  /** Page pre-authenticated as a Resident Tenant */
  residentTenantPage: Page;
}

// ---------------------------------------------------------------------------
// Test account credentials (seeded in E2E test database)
// ---------------------------------------------------------------------------

/**
 * Pre-seeded test accounts for E2E tests.
 *
 * These accounts must exist in the E2E test database before tests run.
 * Typically seeded via a Prisma seed script or a test setup hook.
 */
const TEST_ACCOUNTS: Record<RoleName, { email: string; password: string }> = {
  superAdmin: {
    email: 'superadmin@e2e.concierge.test',
    password: 'E2eTestPassword123!',
  },
  propertyAdmin: {
    email: 'propertyadmin@e2e.concierge.test',
    password: 'E2eTestPassword123!',
  },
  propertyManager: {
    email: 'propertymanager@e2e.concierge.test',
    password: 'E2eTestPassword123!',
  },
  frontDesk: {
    email: 'frontdesk@e2e.concierge.test',
    password: 'E2eTestPassword123!',
  },
  securityGuard: {
    email: 'securityguard@e2e.concierge.test',
    password: 'E2eTestPassword123!',
  },
  maintenanceStaff: {
    email: 'maintenance@e2e.concierge.test',
    password: 'E2eTestPassword123!',
  },
  boardMember: {
    email: 'boardmember@e2e.concierge.test',
    password: 'E2eTestPassword123!',
  },
  residentOwner: {
    email: 'residentowner@e2e.concierge.test',
    password: 'E2eTestPassword123!',
  },
  residentTenant: {
    email: 'residenttenant@e2e.concierge.test',
    password: 'E2eTestPassword123!',
  },
};

// ---------------------------------------------------------------------------
// Auth Helper
// ---------------------------------------------------------------------------

/**
 * Performs login via the UI and returns the authenticated browser context.
 * Stores auth state (cookies, localStorage) so subsequent pages are
 * pre-authenticated without repeating the login flow.
 */
async function authenticateAs(
  browser: import('@playwright/test').Browser,
  baseURL: string,
  role: RoleName,
): Promise<BrowserContext> {
  const account = TEST_ACCOUNTS[role];
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to login
  await page.goto(`${baseURL}/login`);

  // Fill in credentials
  await page.getByLabel('Email').fill(account.email);
  await page.getByLabel('Password').fill(account.password);

  // Submit login form
  await page.getByRole('button', { name: /sign in|log in/i }).click();

  // Wait for successful navigation away from login page
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 15_000,
  });

  await page.close();
  return context;
}

// ---------------------------------------------------------------------------
// Extended Test with Auth Fixtures
// ---------------------------------------------------------------------------

/**
 * Extended Playwright test with pre-authenticated browser contexts.
 *
 * @example
 * ```ts
 * import { test, expect } from '../fixtures/auth';
 *
 * test('front desk can see event grid', async ({ frontDeskPage }) => {
 *   await frontDeskPage.goto('/dashboard');
 *   await expect(frontDeskPage.getByRole('heading', { name: 'Events' })).toBeVisible();
 * });
 *
 * test('resident cannot access admin panel', async ({ residentOwnerPage }) => {
 *   await residentOwnerPage.goto('/admin/settings');
 *   await expect(residentOwnerPage).toHaveURL('/dashboard');
 * });
 * ```
 */
export const test = base.extend<AuthFixtures>({
  superAdminContext: async ({ browser }, use) => {
    const baseURL = process.env['BASE_URL'] ?? 'http://localhost:3000';
    const context = await authenticateAs(browser, baseURL, 'superAdmin');
    await use(context);
    await context.close();
  },
  superAdminPage: async ({ superAdminContext }, use) => {
    const page = await superAdminContext.newPage();
    await use(page);
    await page.close();
  },

  propertyAdminContext: async ({ browser }, use) => {
    const baseURL = process.env['BASE_URL'] ?? 'http://localhost:3000';
    const context = await authenticateAs(browser, baseURL, 'propertyAdmin');
    await use(context);
    await context.close();
  },
  propertyAdminPage: async ({ propertyAdminContext }, use) => {
    const page = await propertyAdminContext.newPage();
    await use(page);
    await page.close();
  },

  propertyManagerContext: async ({ browser }, use) => {
    const baseURL = process.env['BASE_URL'] ?? 'http://localhost:3000';
    const context = await authenticateAs(browser, baseURL, 'propertyManager');
    await use(context);
    await context.close();
  },
  propertyManagerPage: async ({ propertyManagerContext }, use) => {
    const page = await propertyManagerContext.newPage();
    await use(page);
    await page.close();
  },

  frontDeskContext: async ({ browser }, use) => {
    const baseURL = process.env['BASE_URL'] ?? 'http://localhost:3000';
    const context = await authenticateAs(browser, baseURL, 'frontDesk');
    await use(context);
    await context.close();
  },
  frontDeskPage: async ({ frontDeskContext }, use) => {
    const page = await frontDeskContext.newPage();
    await use(page);
    await page.close();
  },

  securityGuardContext: async ({ browser }, use) => {
    const baseURL = process.env['BASE_URL'] ?? 'http://localhost:3000';
    const context = await authenticateAs(browser, baseURL, 'securityGuard');
    await use(context);
    await context.close();
  },
  securityGuardPage: async ({ securityGuardContext }, use) => {
    const page = await securityGuardContext.newPage();
    await use(page);
    await page.close();
  },

  maintenanceStaffContext: async ({ browser }, use) => {
    const baseURL = process.env['BASE_URL'] ?? 'http://localhost:3000';
    const context = await authenticateAs(browser, baseURL, 'maintenanceStaff');
    await use(context);
    await context.close();
  },
  maintenanceStaffPage: async ({ maintenanceStaffContext }, use) => {
    const page = await maintenanceStaffContext.newPage();
    await use(page);
    await page.close();
  },

  boardMemberContext: async ({ browser }, use) => {
    const baseURL = process.env['BASE_URL'] ?? 'http://localhost:3000';
    const context = await authenticateAs(browser, baseURL, 'boardMember');
    await use(context);
    await context.close();
  },
  boardMemberPage: async ({ boardMemberContext }, use) => {
    const page = await boardMemberContext.newPage();
    await use(page);
    await page.close();
  },

  residentOwnerContext: async ({ browser }, use) => {
    const baseURL = process.env['BASE_URL'] ?? 'http://localhost:3000';
    const context = await authenticateAs(browser, baseURL, 'residentOwner');
    await use(context);
    await context.close();
  },
  residentOwnerPage: async ({ residentOwnerContext }, use) => {
    const page = await residentOwnerContext.newPage();
    await use(page);
    await page.close();
  },

  residentTenantContext: async ({ browser }, use) => {
    const baseURL = process.env['BASE_URL'] ?? 'http://localhost:3000';
    const context = await authenticateAs(browser, baseURL, 'residentTenant');
    await use(context);
    await context.close();
  },
  residentTenantPage: async ({ residentTenantContext }, use) => {
    const page = await residentTenantContext.newPage();
    await use(page);
    await page.close();
  },
});

export { expect } from '@playwright/test';
