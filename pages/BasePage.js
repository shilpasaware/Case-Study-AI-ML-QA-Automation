import { expect } from '@playwright/test';

/**
 * BasePage - Base Page Object with reusable methods
 * Playwright recommended: use locator actions + expect() auto-waiting.
 */
export class BasePage {
  constructor(page) {
    this.page = page;
    this.baseURL = process.env.BASE_URL || 'https://govgpt.sandbox.dge.gov.ae';
    this.defaultTimeout = 30000;
  }

  // ============================================================================
  // NAVIGATION METHODS
  // ============================================================================

  async goto(url) {
    const fullUrl = url.startsWith('http') ? url : `${this.baseURL}${url}`;
    await this.page.goto(fullUrl, { waitUntil: 'domcontentloaded' });
  }

  async reload() {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
  }

  async waitForLoadState(state = 'domcontentloaded') {
    await this.page.waitForLoadState(state);
  }

  // ============================================================================
  // INTERACTION METHODS (auto-waiting)
  // ============================================================================

  async click(locator) {
    await expect(locator).toBeVisible();
    await locator.click();
  }

  /**
   * Fill text safely for both:
   * - input/textarea/select (native)
   * - contenteditable div (chat inputs)
   */
  async fill(locator, text) {
    await expect(locator).toBeVisible();

    // Try native fill first
    try {
      await locator.fill(text);
      return;
    } catch (e) {
      // Fallback for contenteditable/custom components
      await locator.click();
      // Clear
      await this.page.keyboard.press('Control+A').catch(() => {});
      await this.page.keyboard.press('Meta+A').catch(() => {}); // mac
      await this.page.keyboard.press('Backspace');
      // Type
      await this.page.keyboard.type(text);
    }
  }

  async type(locator, text, delay = 0) {
    await expect(locator).toBeVisible();
    await locator.type(text, { delay });
  }

  async pressKey(key) {
    await this.page.keyboard.press(key);
  }

  // ============================================================================
  // RETRIEVAL METHODS
  // ============================================================================

  async getText(locator) {
    await expect(locator).toBeVisible();
    const txt = await locator.textContent();
    return (txt ?? '').trim();
  }

  /**
   * Works for both input and contenteditable
   */
  async getValue(locator) {
    await expect(locator).toBeVisible();

    // input/textarea/select
    try {
      return await locator.inputValue();
    } catch {
      // contenteditable/div
      return await locator.evaluate((el) => {
        if ('value' in el) return (el.value ?? '').toString();
        return (el.textContent ?? '').toString().trim();
      });
    }
  }

  async getAttribute(locator, name) {
    await expect(locator).toBeVisible();
    return await locator.getAttribute(name);
  }

  async getCount(locator) {
    return await locator.count();
  }

  async getAllTexts(locator) {
    return await locator.allTextContents();
  }

  // ============================================================================
  // VALIDATION METHODS (avoid manual waits)
  // ============================================================================

  async isVisible(locator) {
    return await locator.isVisible().catch(() => false);
  }

  async isHidden(locator) {
    return await locator.isHidden().catch(() => false);
  }

  async isEnabled(locator) {
    return await locator.isEnabled().catch(() => false);
  }

  async isDisabled(locator) {
    return await locator.isDisabled().catch(() => false);
  }

  // ============================================================================
  // ASSERTION METHODS (Playwright auto-waiting)
  // ============================================================================

  async expectVisible(locator, message = '') {
    await expect(locator, message).toBeVisible();
  }

  async expectHidden(locator, message = '') {
    await expect(locator, message).toBeHidden();
  }

  async expectText(locator, text, message = '') {
    await expect(locator, message).toContainText(text);
  }

  /**
   * Value assertion that works for both input and contenteditable.
   */
  async expectValue(locator, value, message = '') {
    // Try toHaveValue for inputs
    try {
      await expect(locator, message).toHaveValue(value);
    } catch {
      // Fallback for contenteditable/custom components
      await expect(locator, message).toContainText(value);
    }
  }

  async expectCount(locator, count, message = '') {
    await expect(locator, message).toHaveCount(count);
  }

  // ============================================================================
  // POLLING (for dynamic async UI without sleeps)
  // ============================================================================

  async expectPoll(fn, assertionFn, { timeout = this.defaultTimeout, interval = 250 } = {}) {
    const result = await expect.poll(fn, { timeout, intervals: [interval] });
    await assertionFn(result);
  }

  // ============================================================================
  // SCROLL METHODS
  // ============================================================================

  async scrollIntoView(locator) {
    await locator.scrollIntoViewIfNeeded();
  }

  async scrollToTop() {
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }

  async scrollToBottom() {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async takeScreenshot(name) {
    await this.page.screenshot({
      path: `reports/screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }

  async executeScript(script, ...args) {
    return await this.page.evaluate(script, ...args);
  }

  getViewport() {
    return this.page.viewportSize();
  }

  getCurrentUrl() {
    return this.page.url();
  }

  async getTitle() {
    return await this.page.title();
  }
}
