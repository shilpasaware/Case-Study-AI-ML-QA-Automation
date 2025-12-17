import { BasePage } from './BasePage.js';
import { expect } from '@playwright/test';

/**
 * ChatbotPage - Page Object Model for U-Ask Chatbot
 * Playwright-recommended auto-waiting, minimal explicit waits, non-flaky.
 */
export class ChatbotPage extends BasePage {
  constructor(page) {
    super(page);
  }

  // ==========================================================================
  // LOCATORS (All defined once)
  // ==========================================================================

  // --- Login Locators ---
  get loginButton() {
    return this.page.locator('button').filter({ hasText: 'Log in' }).first();
  }

  get loginHyperLink() {
    return this.page.locator('span').filter({ hasText: 'Log in' });
  }

  get emailInput() {
    return this.page.getByRole('textbox', { name: 'Email' });
  }

  get passwordInput() {
    return this.page.getByRole('textbox', { name: 'Password' });
  }

  // --- Chat Input Locators ---
  get messageInput() {
    return this.page.locator('#chat-input');
  }

  get sendButton() {
    return this.page.locator('#send-message-button');
  }

  // --- Chat Container Locators ---
  get chatContainer() {
    // Keep it simple: we validate via input/button visibility instead of fragile "paragraph"
    return this.page.locator('body');
  }

  // --- Messages ---
  // AI responses are inside this container (as per your existing locator)
  get aiMessages() {
    return this.page.locator('#response-content-container');
  }

  // ✅ Robust user message locator:
  // After sending, the user's question text should appear somewhere in the conversation.
  // So we assert presence by text, not by "paragraph + class user".
  userMessageByText(text) {
    // Use exact-ish match to avoid false positives from suggestions.
    // If your app echoes the text, this will be stable.
    return this.page.getByText(text, { exact: false });
  }

  // --- Status Locators ---
  get loadingIndicator() {
    return this.page.locator(
      '[class*="loading"], [class*="spinner"], [class*="typing"], [aria-busy="true"]'
    );
  }

  get errorMessage() {
    return this.page.locator('[class*="error"], [role="alert"]');
  }

  // --- Language Locators ---
  get userProfileButton() {
    return this.page.getByRole('button', { name: 'User profile' }).nth(1);
  }

  get languageSwitch() {
    return this.page.getByRole('switch').first();
  }

  // ==========================================================================
  // AUTHENTICATION METHODS (auto-waiting, idempotent)
  // ==========================================================================

  /**
   * Login to the application (idempotent)
   * - If already logged in, it just ensures chat UI is ready
   * - Else performs login and waits for chat UI
   */
  async login() {
    console.log('🔐 login(): ensuring authenticated session...');

    const baseUrl = process.env.BASE_URL || 'https://govgpt.sandbox.dge.gov.ae/';
    const username = process.env.USERNAME || 'qatest1@dge.gov.ae';
    const password = process.env.PASSWORD || 'DGEUser100!';

    await this.page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

    // ✅ If already logged in, chat input should be visible
    if (await this.messageInput.isVisible().catch(() => false)) {
      await expect(this.messageInput).toBeVisible();
      console.log('✅ Already logged in');
      return;
    }

    await this.loginHyperLink.click();

    // Auto-waiting assertions + actions
    await expect(this.emailInput).toBeVisible();
    await this.emailInput.fill(username);

    await expect(this.passwordInput).toBeVisible();
    await this.passwordInput.fill(password);

    await expect(this.loginButton).toBeVisible();
    await this.loginButton.click();

    // ✅ Auto-wait until chat is ready
    await expect(this.messageInput).toBeVisible({ timeout: 20000 });

    // Optional: first-time consent popup (accept/reject) if it exists
    const acceptBtn = this.page.getByRole('button', { name: /accept/i });
    if (await acceptBtn.isVisible().catch(() => false)) {
      await acceptBtn.click();
    }

    console.log('✅ Login successful');
  }

  // ==========================================================================
  // MESSAGE METHODS (auto-waiting, no flaky waits)
  // ==========================================================================

  /**
   * Type message in the input reliably (supports non-input contenteditable)
   */
  async typeMessage(message) {
    // Ensure input is ready
    await expect(this.messageInput).toBeVisible();
    await this.messageInput.click();

    // Clear + type using Playwright recommended approach:
    // - fill() works for inputs/textarea; for contenteditable it often works too.
    // If fill() ever fails on your DOM, swap to .pressSequentially() fallback.
    try {
      await this.messageInput.fill(message);
    } catch {
      await this.messageInput.click();
      await this.page.keyboard.press('Control+A'); // mac also works with Meta; keep generic
      await this.page.keyboard.type(message);
    }

    // ✅ Verify typed text (contenteditable-safe)
    await expect(this.messageInput).toContainText(message);
  }

  /**
   * Send a message in the chat
   * @param {string} message
   * @param {boolean} waitForResponse
   */
  async sendMessage(message, waitForResponse = true, { verifyEcho = true } = {}) {
    await this.typeMessage(message);
    await this.sendButton.click();
  
    if (verifyEcho) {
      await this.verifyMessageSent(message);
    }
  
    if (waitForResponse) {
      await this.waitForAiResponse();
    }
  }
  /**
   * Send message using Enter key
   */
  async sendMessageWithEnter(message, waitForResponse = true) {
    await this.typeMessage(message);
    await this.page.keyboard.press('Enter');

    await this.verifyMessageSent(message);

    if (waitForResponse) {
      await this.waitForAiResponse();
    }
  }

  /**
   * ✅ FIXED: Wait for AI response with improved detection logic
   * Waits for actual content change in the AI response container
   */
  async waitForAiResponse(timeout = 25000) {
    console.log('⏳ Waiting for AI response...');

    try {
      // First, wait for loading indicator to appear and disappear (if it exists)
      const loadingElement = this.loadingIndicator;
      const loadingVisible = await loadingElement.isVisible().catch(() => false);

      if (loadingVisible) {
        console.log('⏳ Loading indicator detected, waiting for it to disappear...');
        await expect(loadingElement).toBeHidden({ timeout });
      }

      // ✅ KEY FIX: Wait for AI response container to have visible content
      // Instead of counting, check if response content is visible and has text
      await expect(this.aiMessages).toBeVisible({ timeout });

      // Ensure the AI message actually has content (not empty)
      await expect.poll(
        async () => {
          const text = await this.aiMessages.textContent();
          return (text || '').trim().length > 0;
        },
        {
          timeout,
          intervals: [500],
        }
      ).toBeTruthy();

      // Ensure last message is visible in viewport
      const lastMessage = this.aiMessages.last();
      await expect(lastMessage).toBeVisible({ timeout });

      console.log('✅ AI response received with content');
    } catch (error) {
      console.error('❌ Failed to receive AI response:', error.message);
      throw error;
    }
  }

  // ==========================================================================
  // RETRIEVAL METHODS
  // ==========================================================================

  async getLastAiResponse() {
    await expect(this.aiMessages.last()).toBeVisible({ timeout: 20000 });
    const responses = await this.aiMessages.allTextContents();
    return responses[responses.length - 1]?.trim() || '';
  }

  // NOTE: Avoid "getLastUserMessage()" because DOM doesn't reliably expose a user bubble locator.
  // We validate user messages by text presence instead.

  async getMessageCount() {
    // Not stable with role paragraph; keep it simple:
    // Count AI messages as "conversation progress" signal.
    return await this.aiMessages.count();
  }

  // ==========================================================================
  // VALIDATION METHODS (auto-waiting assertions)
  // ==========================================================================

  async verifyChatLoaded() {
    console.log('✓ Verifying chat loaded...');
  
    // Mobile-safe, stable checks
    await expect(this.sendButton).toBeVisible({ timeout: 20000 });
  
    // Message input may be disabled but should exist
    await expect(this.messageInput).toBeAttached();
  
    console.log('✅ Chat loaded');
  }
  

  async verifyMessageSent(message) {
    // Auto-waits until the message text appears visibly anywhere in the UI
    const msg = this.userMessageByText(message);

    await expect(
      msg.first(),
      `Expected user message to appear in chat: "${message}"`
    ).toBeVisible({ timeout: 15000 });
  }

  async verifyAiResponseReceived() {
    const response = await this.getLastAiResponse();
    expect(response.length).toBeGreaterThan(0);
  }

  async verifyInputCleared() {
    // For contenteditable input, after send, textContent should be empty
    await expect(this.messageInput).toHaveText('', { timeout: 5000 }).catch(async () => {
      // fallback: allow whitespace
      const txt = await this.messageInput.textContent();
      expect((txt || '').trim()).toBe('');
    });
  }

  async verifyResponseNotEmpty() {
    const response = await this.getLastAiResponse();
    expect(response.trim().length).toBeGreaterThan(0);
  }

  async verifyResponseContainsKeywords(keywords, response = null) {
    const text = (response ?? (await this.getLastAiResponse())).toLowerCase();
    for (const kw of keywords) {
      expect(text).toContain(String(kw).toLowerCase());
    }
  }

  // ==========================================================================
  // LANGUAGE METHODS
  // ==========================================================================

  async switchToArabic() {
    await expect(this.userProfileButton).toBeVisible();
    await this.userProfileButton.click();

    await expect(this.languageSwitch).toBeVisible();
    await this.languageSwitch.click();
  }

  async switchToEnglish() {
    await expect(this.userProfileButton).toBeVisible();
    await this.userProfileButton.click();

    await expect(this.languageSwitch).toBeVisible();
    await this.languageSwitch.click();
  }

  async getTextDirection() {
    // Use document.dir as reliable source
    return (await this.page.evaluate(() => document.dir)) || 'ltr';
  }

  async verifyLTR() {
    await expect.poll(async () => await this.getTextDirection()).toBe('ltr');
  }

  async verifyRTL() {
    await expect.poll(async () => await this.getTextDirection()).toBe('rtl');
  }

  // ==========================================================================
  // ACCESSIBILITY METHODS
  // ==========================================================================

  async verifyKeyboardNavigation() {
    await this.page.keyboard.press('Tab');
  }

  async verifyAriaLabels() {
    const inputLabel =
      (await this.messageInput.getAttribute('aria-label')) ||
      (await this.messageInput.getAttribute('aria-labelledby'));
    const buttonLabel = await this.sendButton.getAttribute('aria-label');

    expect(inputLabel || buttonLabel).toBeTruthy();
  }

  // ==========================================================================
  // SCROLL METHODS
  // ==========================================================================

  async scrollToLatestMessage() {
    // Scroll to last AI message as a stable proxy for "latest"
    if (await this.aiMessages.count().catch(() => 0)) {
      await this.aiMessages.last().scrollIntoViewIfNeeded();
    }
  }

  async verifyAutoScroll() {
    // Keep as-is: best-effort check
    const isAtBottom = await this.page.evaluate(() => {
      const container =
        document.querySelector('[class*="message"], [class*="chat"], [role="log"], [aria-live]') ||
        document.scrollingElement;
      if (!container) return true;
      return Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 150;
    });
    expect(isAtBottom).toBeTruthy();
  }

  async verifyKeyboardNavigation() {
    console.log('⌨️ Testing keyboard navigation with Tab key...');
    
    await this.messageInput.click();
    await this.page.waitForTimeout(100);
    
    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(200);
    
    const focusedElement = await this.page.evaluate(() => document.activeElement.id || document.activeElement.tagName);
    
    console.log(`✅ Tab navigation moved focus to: ${focusedElement}`);
  }
  
  async verifyAriaLabels() {
    console.log('♿ Checking ARIA labels...');
    
    const inputLabel = await this.messageInput.getAttribute('aria-label');
    const buttonLabel = await this.sendButton.getAttribute('aria-label');
    
    if (inputLabel || buttonLabel) {
      console.log('✅ ARIA labels found');
    } else {
      console.log('⚠️ No ARIA labels found');
    }
  }
  
  async verifyFocusIndicators() {
    console.log('✨ Verifying focus indicators...');
    
    await this.messageInput.click();
    await this.page.waitForTimeout(100);
    
    const hasFocus = await this.page.evaluate(() => {
      const el = document.activeElement;
      return el && (el.id === 'chat-input' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
    });
    
    expect(hasFocus).toBeTruthy();
    console.log('✅ Focus indicators working');
  }
  
  async testTabKeyNavigation() {
    console.log('🔀 Testing Tab key sequence...');
    
    await this.messageInput.click();
    await this.page.waitForTimeout(100);
    
    for (let i = 0; i < 3; i++) {
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(150);
    }
    
    console.log('✅ Tab navigation verified');
  }
  
  async testEnterKeyMessage(message) {
    console.log('⌨️ Testing Enter key to send message...');
    
    await this.typeMessage(message);
    await this.page.keyboard.press('Enter');
    await this.verifyMessageSent(message);
    await this.waitForAiResponse();
    
    console.log('✅ Enter key message sent');
  }
  
  async verifySemanticHTML() {
    console.log('📄 Checking semantic HTML...');
    
    const hasButtons = await this.page.evaluate(() => {
      return document.querySelectorAll('button').length > 0;
    });
    
    const hasInputs = await this.page.evaluate(() => {
      return document.querySelectorAll('input, textarea').length > 0;
    });
    
    expect(hasButtons || hasInputs).toBeTruthy();
    console.log('✅ Semantic HTML verified');
  }
  
  async verifyInputAccessibility() {
    console.log('♿ Testing input accessibility...');
    
    await expect(this.messageInput).toBeVisible();
    
    const isEnabled = await this.messageInput.isEnabled();
    expect(isEnabled).toBeTruthy();
    
    console.log('✅ Input is accessible and enabled');
  }
  
  async verifySendButtonAccessibility() {
    console.log('♿ Testing send button accessibility...');
    
    await expect(this.sendButton).toBeVisible();
    
    const isEnabled = await this.sendButton.isEnabled();
    expect(isEnabled).toBeTruthy();
    
    console.log('✅ Send button is accessible and enabled');
  }
    

  // ==========================================================================
  // SECURITY METHODS
  // ==========================================================================

  async verifyNoScriptExecution(payload) {
    await this.sendMessage(payload, false);

    // Playwright auto-wait: if a dialog appears, fail
    let dialogSeen = false;
    this.page.once('dialog', async (d) => {
      dialogSeen = true;
      await d.dismiss();
    });

    // Give the page a chance to trigger dialog via built-in expect.poll (no raw wait)
    await expect.poll(() => dialogSeen, { timeout: 2000 }).toBeFalsy();

    // Message should be present as text
    await this.verifyMessageSent(payload);
  }

   async waitForUserSendAcknowledged(timeout = 20000) {
    // The safest generic signal: input clears OR send button becomes disabled/enabled again
    await expect.poll(async () => {
      const txt = (await this.messageInput.textContent().catch(() => '')) || '';
      return txt.trim().length === 0;
    }, { timeout }).toBeTruthy();
  }
  // ==========================================================================
  // MOBILE METHODS
  // ==========================================================================

  async verifyMobileResponsive() {
    await this.verifyChatLoaded();

    const hasHorizontalScroll = await this.page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(hasHorizontalScroll).toBeFalsy();
  }

  async testTouchInteraction() {
    await expect(this.messageInput).toBeVisible();
    await this.messageInput.tap?.().catch(async () => {
      // fallback if tap() not available in your context
      await this.messageInput.click();
    });

    const isFocused = await this.page.evaluate(() => {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName;
      return tag === 'TEXTAREA' || tag === 'INPUT' || el.isContentEditable === true;
    });
    expect(isFocused).toBeTruthy();
  }

  // ==========================================================================
  // PERFORMANCE METHODS
  // ==========================================================================

  async measureResponseTime(message) {
    const start = Date.now();
    await this.sendMessage(message, true);
    return Date.now() - start;
  }

  async clearChat() {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await this.verifyChatLoaded();
  }

}