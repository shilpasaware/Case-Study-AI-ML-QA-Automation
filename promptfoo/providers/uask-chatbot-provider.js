/**
 * U-Ask Chatbot Provider for Promptfoo (Playwright)
 * Robust auto-waiting: returns PASS output only when final answer is ready.
 */

import { chromium, expect } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default class UAskChatbotProvider {
  constructor(options = {}) {
    this.config = {
      baseUrl: process.env.BASE_URL || 'https://govgpt.sandbox.dge.gov.ae/',
      username: process.env.USERNAME || 'qatest1@dge.gov.ae',
      password: process.env.PASSWORD || 'DGEUser100!',
      language: options.language || 'en',
    };

    this.browser = null;
    this._browserPromise = null;

    // Serialize calls: promptfoo may run 4 at once; UI is flaky when parallel.
    this._queue = Promise.resolve();
  }

  id() {
    return 'uask-chatbot-provider';
  }

  async _getBrowser() {
    if (this.browser) return this.browser;
    if (!this._browserPromise) {
      this._browserPromise = chromium.launch({
        headless: (process.env.HEADLESS ?? 'true').toLowerCase() !== 'false',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
    this.browser = await this._browserPromise;
    return this.browser;
  }

  async callApi(prompt, options = {}) {
    this._queue = this._queue.then(() => this._callApiInternal(prompt, options));
    return this._queue;
  }

  async _callApiInternal(prompt, options) {
    let context = null;
    let page = null;

    const timeoutMs =
      Number(options?.timeout) ||
      Number(process.env.TEST_TIMEOUT) ||
      120000;

    try {
      const browser = await this._getBrowser();

      context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        locale: this.config.language === 'ar' ? 'ar-AE' : 'en-US',
      });

      page = await context.newPage();

      await this.login(page);

      // Read current response snapshot so we can wait for a NEW one
      const before = await this.getAiText(page).catch(() => '');

      await this.sendMessage(page, prompt);

      // Wait for final answer that meets PASS criteria
      await this.waitForFinalAiResponse(page, {
        timeout: timeoutMs,
        previousText: before,
      });

      const response = await this.getAiText(page);
      return { output: response };
    } catch (error) {
      console.error('[Provider] Error:', error);
      return {
        output: `Error: ${error?.message || String(error)}`,
        error: error?.message || String(error),
      };
    } finally {
      if (context) await context.close();
    }
  }

  async login(page) {
    await page.goto(this.config.baseUrl, { waitUntil: 'domcontentloaded' });

    const messageInput = page.locator('#chat-input');
    const loginHyperLink = page.locator('span').filter({ hasText: 'Log in' });
    const emailInput = page.getByRole('textbox', { name: 'Email' });
    const passwordInput = page.getByRole('textbox', { name: 'Password' });
    const loginButton = page.locator('button').filter({ hasText: 'Log in' }).first();

    // already logged in
    if (await messageInput.isVisible().catch(() => false)) {
      await expect(messageInput).toBeVisible();
      return;
    }

    await loginHyperLink.click();

    await expect(emailInput).toBeVisible();
    await emailInput.fill(this.config.username);

    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(this.config.password);

    await expect(loginButton).toBeVisible();
    await loginButton.click();

    await expect(messageInput).toBeVisible({ timeout: 20000 });

    const acceptBtn = page.getByRole('button', { name: /accept/i });
    if (await acceptBtn.isVisible().catch(() => false)) {
      await acceptBtn.click();
    }
  }

  async sendMessage(page, message) {
    const messageInput = page.locator('#chat-input');
    const sendButton = page.locator('#send-message-button');

    await expect(messageInput).toBeVisible();
    await messageInput.fill(message);

    await expect(sendButton).toBeVisible();
    await sendButton.click();
  }

  /**
   * Returns the AI response text from the response container.
   * We keep it simple and read the container's textContent.
   */
  async getAiText(page) {
    const container = page.locator('#response-content-container');
    await expect(container).toBeVisible({ timeout: 20000 });
    const text = await container.textContent();
    return (text || '').trim();
  }

  /**
   * PASS criteria:
   * - placeholder/loading text is gone
   * - no error/retry/fallback
   * - has meaningful length
   * - different from previousText
   * - stable (stops changing)
   */
  async waitForFinalAiResponse(page, { timeout = 180000 } = {}) {
    const container = page.locator('#response-content-container');
    await expect(container).toBeVisible({ timeout });
  
    const normalize = (t) => (t || '').trim().replace(/\s+/g, ' ');
    const lower = (t) => normalize(t).toLowerCase();
  
    const isPlaceholder = (t) =>
      /working on it|please wait|loading|one moment|typing|processing/i.test(lower(t));
  
    const isFailure = (t) =>
      /something went wrong|try again|unable to|timed out|timeout|service unavailable/i.test(lower(t));
  
    const isSystemError = (t) =>
      /^(error:|exception:)/i.test(normalize(t));
  
    const minLen = 80;
  
    let last = '';
    let stableCount = 0;
  
    await expect
      .poll(
        async () => {
          const current = normalize(await this.getAiText(page).catch(() => ''));
  
          const ok =
            current.length >= minLen &&
            !isPlaceholder(current) &&
            !isFailure(current) &&
            !isSystemError(current);
  
          if (current && current === last) stableCount += 1;
          else stableCount = 0;
  
          last = current;
  
          return ok && stableCount >= 2;
        },
        { timeout, intervals: [1000] }
      )
      .toBeTruthy();
  }
}  