/**
 * Puppeteer Test Configuration
 *
 * Visible Chrome browser testing for end-to-end user flows.
 * All tests run with headless: false so flows can be observed.
 */

export const CONFIG = {
  /** Live site URL */
  baseUrl: 'https://concierge-sigma-seven.vercel.app',

  /** Browser settings — VISIBLE mode for observation */
  browser: {
    headless: false,
    slowMo: 100, // Slow down actions so they're observable
    defaultViewport: { width: 1440, height: 900 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },

  /** Screenshot directory */
  screenshotDir: 'tests/puppeteer/screenshots',

  /** Timeouts */
  timeouts: {
    navigation: 15000,
    element: 10000,
    action: 5000,
  },

  /** Demo login roles */
  roles: {
    pm: 'Property Manager',
    frontDesk: 'Demo: Front Desk',
    security: 'Demo: Security',
    resident: 'Demo: Resident',
    superAdmin: 'Super Admin',
  },
} as const;
