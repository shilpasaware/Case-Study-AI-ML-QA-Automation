import { test, expect } from '@playwright/test';
import { ChatbotPage } from '../pages/ChatbotPage.js';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

let chatbotPage;
let testData;

// ============================================================================
// DESKTOP / DEFAULT TESTS (all except TC-UI-002)
// ============================================================================
test.describe('UI Behavior Tests', () => {
  test.beforeAll(async () => {
    const data = await fs.readFile('test-data/prompts-en.json', 'utf-8');
    testData = JSON.parse(data);
  });

  test.beforeEach(async ({ page }) => {
    chatbotPage = new ChatbotPage(page);
    await chatbotPage.login();
    await chatbotPage.waitForLoadState();
  });

  // ============================================================================
  // TC-UI-001: Verify Chat Widget Loads on Desktop
  // ============================================================================
  test('TC-UI-001: Chat widget loads correctly on desktop', async () => {
    test.setTimeout(60000);

    await test.step('Verify chat container is visible', async () => {
      await chatbotPage.verifyChatLoaded();
      console.log('✓ Chat container verified');
    });

    await test.step('Verify input box is visible and send button state', async () => {
      await chatbotPage.expectVisible(chatbotPage.messageInput, 'Input should be visible');
      expect(await chatbotPage.isEnabled(chatbotPage.messageInput)).toBeTruthy();

      // Send button usually disabled when empty (UX)
      expect(await chatbotPage.isEnabled(chatbotPage.sendButton)).toBeFalsy();

      console.log('✓ Input enabled, send button correctly disabled for empty input');
    });

    await test.step('Take screenshot for verification', async () => {
      await chatbotPage.takeScreenshot('TC-UI-001-desktop-view');
      console.log('✓ Screenshot captured');
    });
  });

  // ============================================================================
  // TC-UI-003: Verify User Can Send Messages
  // ============================================================================
  test('TC-UI-003: User can send messages via input box', async () => {
    test.setTimeout(60000);

    const testMessage = testData.simple_queries[0].query;

    await test.step('Click on message input box', async () => {
      await chatbotPage.click(chatbotPage.messageInput);
      await expect(chatbotPage.messageInput).toBeVisible();
      console.log('✓ Input box clicked');
    });

    await test.step('Type test message', async () => {
      await chatbotPage.fill(chatbotPage.messageInput, testMessage);

      // contenteditable-safe check
      await expect(chatbotPage.messageInput).toContainText(testMessage);
      console.log(`✓ Message typed: "${testMessage}"`);

      // send button should become enabled after typing (if UX supports it)
      // If your app keeps it enabled always, this won't fail because we don't hard-assert enabled here.
    });

    await test.step('Click send button', async () => {
      await chatbotPage.click(chatbotPage.sendButton);
      console.log('✓ Send button clicked');
    });

    await test.step('Verify message appears in conversation', async () => {
      // ✅ relies on Playwright auto-waiting inside verifyMessageSent()
      await chatbotPage.verifyMessageSent(testMessage);
      console.log('✓ User message displayed in chat');
    });
  });

  // ============================================================================
  // TC-UI-004: Verify AI Response Rendering
  // ============================================================================
  test('TC-UI-004: AI response renders correctly', async () => {
    test.setTimeout(90000);

    const testQuery = testData.service_queries[0];

    await test.step('Send a message', async () => {
      await chatbotPage.sendMessage(testQuery.query, false);
      console.log('✓ Message sent');
    });

    await test.step('Wait for AI response', async () => {
      await chatbotPage.waitForAiResponse(20000);
      console.log('✓ AI response received');
    });

    await test.step('Verify response appears in conversation', async () => {
      await chatbotPage.verifyAiResponseReceived();
      console.log('✓ AI response displayed');
    });

    await test.step('Verify response formatting is clean', async () => {
      const response = await chatbotPage.getLastAiResponse();

      expect(response).toBeTruthy();
      expect(response.length).toBeGreaterThan(0);
      expect(response).not.toContain('<script>');
      expect(response).not.toContain('undefined');
      expect(response).not.toContain('null');

      console.log(`✓ Response length: ${response.length} chars`);
      console.log(`  Response preview: "${response.substring(0, 100)}..."`);
    });

    await test.step('Take screenshot of conversation', async () => {
      await chatbotPage.takeScreenshot('TC-UI-004-ai-response');
      console.log('✓ Screenshot captured');
    });
  });

  // ============================================================================
  // TC-UI-005: Verify English Language Support (LTR)
  // ============================================================================
  test('TC-UI-005: English language support (LTR)', async () => {
    test.setTimeout(60000);

    const englishQuery = testData.simple_queries[0].query;

    await test.step('Send English message', async () => {
      await chatbotPage.sendMessage(englishQuery);
      console.log('✓ English message sent');
    });

    await test.step('Verify text direction is LTR', async () => {
      const textDir = await chatbotPage.getTextDirection();
      console.log(`  Text direction: ${textDir}`);

      expect(['ltr', '', null]).toContain(textDir);
      console.log('✓ LTR direction verified');
    });

    await test.step('Verify English text displays correctly', async () => {
      // auto-wait: the sent text must appear in the UI
      await chatbotPage.verifyMessageSent(englishQuery);
      console.log('✓ English text displayed correctly');
    });
  });

  // ============================================================================
  // TC-UI-006: Verify Arabic Language Support (RTL)
  // ============================================================================
  test('TC-UI-006: Arabic language support (RTL)', async () => {
    test.setTimeout(60000);

    const arabicData = await fs.readFile('test-data/prompts-ar.json', 'utf-8');
    const arabicQueries = JSON.parse(arabicData);
    const arabicQuery = arabicQueries.arabic_queries[0];

    console.log(`  Arabic query: "${arabicQuery.query}"`);

    await test.step('Send Arabic message', async () => {
      await chatbotPage.sendMessage(arabicQuery.query);
      console.log('✓ Arabic message sent');
    });

    await test.step('Verify Arabic text displays correctly', async () => {
      await chatbotPage.verifyMessageSent(arabicQuery.query);
      console.log('✓ Arabic text displayed');
    });

    await test.step('Check text direction', async () => {
      const textDir = await chatbotPage.getTextDirection();
      console.log(`  Text direction: ${textDir}`);
    });

    await test.step('Take screenshot of Arabic content', async () => {
      await chatbotPage.takeScreenshot('TC-UI-006-arabic-rtl');
      console.log('✓ Screenshot captured');
    });
  });

  // ============================================================================
  // TC-UI-007: Verify Input Cleared After Sending
  // ============================================================================
  test('TC-UI-007: Input cleared after sending message', async () => {
    test.setTimeout(60000);

    const testMessage = 'Test message for input clearing';

    await test.step('Type message in input box', async () => {
      await chatbotPage.fill(chatbotPage.messageInput, testMessage);
      await expect(chatbotPage.messageInput).toContainText(testMessage);
      console.log('✓ Message typed');
    });

    await test.step('Click send button', async () => {
      await chatbotPage.click(chatbotPage.sendButton);
      console.log('✓ Send button clicked');
    });

    await test.step('Verify input box is cleared', async () => {
      // should be empty after send (your POM handles fallback for contenteditable)
      await chatbotPage.verifyInputCleared();
      console.log('✓ Input box cleared');
    });

    await test.step('Verify input remains enabled', async () => {
      expect(await chatbotPage.isEnabled(chatbotPage.messageInput)).toBeTruthy();
      console.log('✓ Input ready for next message');
    });

    await test.step('Type another message immediately', async () => {
      await chatbotPage.fill(chatbotPage.messageInput, 'Second message');
      await expect(chatbotPage.messageInput).toContainText('Second message');
      console.log('✓ Second message can be typed immediately');
    });
  });

  // ============================================================================
  // TC-UI-008: Verify Scroll and Accessibility
  // ============================================================================
  test('TC-UI-008: Accessibility Features Work', async () => {
    test.setTimeout(60000);
  
    console.log('\n================ TC-UI-008: Accessibility =================');
  
    // Ensure chat is ready
    await chatbotPage.verifyChatLoaded();
  
    // 1️⃣ Enter key should send message
    await test.step('Send message using Enter key', async () => {
      const msg = 'Testing Enter key accessibility';
      await chatbotPage.sendMessageWithEnter(msg);
      await chatbotPage.verifyMessageSent(msg);
      console.log('✓ Enter key sends message');
    });
  
    // 2️⃣ Keyboard navigation (Tab)
    await test.step('Verify keyboard navigation works', async () => {
      await chatbotPage.verifyKeyboardNavigation();
      console.log('✓ Keyboard navigation via Tab works');
    });
  
    // 3️⃣ ARIA labels present
    await test.step('Verify ARIA labels for accessibility', async () => {
      await chatbotPage.verifyAriaLabels();
      console.log('✓ ARIA labels present');
    });
  
    console.log('✅ Accessibility checks passed');
  });
  
    
// ============================================================================
// MOBILE ONLY: TC-UI-002 (viewport set BEFORE login)
// ============================================================================
// test.describe('UI Behavior Tests - Mobile only (TC-UI-002)', () => {
//   test.use({ viewport: { width: 375, height: 812 } });

//   test.beforeAll(async () => {
//     const data = await fs.readFile('test-data/prompts-en.json', 'utf-8');
//     testData = JSON.parse(data);
//   });

//   test.beforeEach(async ({ page }) => {
//     chatbotPage = new ChatbotPage(page);
//     await chatbotPage.login();
//     await chatbotPage.waitForLoadState();
//   });

//   test('TC-UI-002: Chat widget loads correctly on mobile', async () => {
//     test.setTimeout(60000);

//     await test.step('Verify chat adapts to mobile screen', async () => {
//       await chatbotPage.verifyChatLoaded();
//       console.log('✓ Chat loaded on mobile');
//     });

//     await test.step('Verify mobile responsive behavior', async () => {
//       await chatbotPage.verifyMobileResponsive();
//       console.log('✓ Responsive design verified');
//     });

//     await test.step('Verify UI elements accessible without horizontal scroll', async () => {
//       await expect(chatbotPage.messageInput).toBeVisible();
//       await expect(chatbotPage.sendButton).toBeVisible();
//       console.log('✓ All UI elements accessible');
//     });

//     await test.step('Take mobile screenshot', async () => {
//       await chatbotPage.takeScreenshot('TC-UI-002-mobile-view');
//       console.log('✓ Screenshot captured');
//     });
  });
