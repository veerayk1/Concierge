/**
 * Puppeteer Test Helpers
 *
 * Shared utilities for browser-based user flow testing.
 */

import puppeteer, { type Browser, type Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { CONFIG } from './config';

// Ensure screenshot directory exists
if (!fs.existsSync(CONFIG.screenshotDir)) {
  fs.mkdirSync(CONFIG.screenshotDir, { recursive: true });
}

/**
 * Launch a visible Chrome browser
 */
export async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: CONFIG.browser.headless,
    slowMo: CONFIG.browser.slowMo,
    defaultViewport: CONFIG.browser.defaultViewport,
    args: CONFIG.browser.args,
  });
}

/**
 * Take a screenshot with a descriptive name
 */
export async function screenshot(page: Page, name: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${name}_${timestamp}.png`;
  const filepath = path.join(CONFIG.screenshotDir, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`  📸 Screenshot: ${filename}`);
  return filepath;
}

/**
 * Login as a specific demo role
 */
export async function loginAs(page: Page, role: string): Promise<void> {
  await page.goto(`${CONFIG.baseUrl}/login`, {
    waitUntil: 'networkidle2',
    timeout: CONFIG.timeouts.navigation,
  });

  // Find and click the role button
  const buttons = await page.$$('button');
  for (const button of buttons) {
    const text = await button.evaluate((el) => el.textContent || '');
    if (text.includes(role)) {
      await button.click();
      break;
    }
  }

  // Wait for navigation to dashboard
  await page.waitForNavigation({
    waitUntil: 'networkidle2',
    timeout: CONFIG.timeouts.navigation,
  });
}

/**
 * Navigate to a page and wait for it to load
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(`${CONFIG.baseUrl}${path}`, {
    waitUntil: 'networkidle2',
    timeout: CONFIG.timeouts.navigation,
  });
}

/**
 * Wait for a selector to appear and return the element
 */
export async function waitForElement(page: Page, selector: string) {
  return page.waitForSelector(selector, {
    timeout: CONFIG.timeouts.element,
  });
}

/**
 * Type text into an input after clicking it
 */
export async function typeInto(page: Page, selector: string, text: string): Promise<void> {
  await page.click(selector);
  await page.type(selector, text);
}

/**
 * Click a button by its text content
 */
export async function clickButton(page: Page, text: string): Promise<boolean> {
  const buttons = await page.$$('button');
  for (const button of buttons) {
    const btnText = await button.evaluate((el) => el.textContent || '');
    if (btnText.includes(text)) {
      await button.click();
      return true;
    }
  }
  return false;
}

/**
 * Get the text content of a page element
 */
export async function getTextContent(page: Page, selector: string): Promise<string> {
  const element = await page.$(selector);
  if (!element) return '';
  return element.evaluate((el) => el.textContent || '');
}

/**
 * Check if an element exists on the page
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  const element = await page.$(selector);
  return element !== null;
}

/**
 * Wait for text to appear anywhere on the page
 */
export async function waitForText(page: Page, text: string): Promise<void> {
  await page.waitForFunction(
    (t: string) => document.body.innerText.includes(t),
    { timeout: CONFIG.timeouts.element },
    text,
  );
}

/**
 * Log a test result with color
 */
export function logResult(testName: string, passed: boolean, details?: string): void {
  const icon = passed ? '✅' : '❌';
  console.log(`  ${icon} ${testName}${details ? ` — ${details}` : ''}`);
}

/**
 * Run a test with error handling
 */
export async function runTest(
  name: string,
  fn: () => Promise<void>,
): Promise<{ name: string; passed: boolean; error?: string }> {
  try {
    await fn();
    logResult(name, true);
    return { name, passed: true };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logResult(name, false, errorMsg);
    return { name, passed: false, error: errorMsg };
  }
}
