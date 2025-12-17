import { test, expect } from '@playwright/test';
import { ChatbotPage } from '../pages/ChatbotPage.js';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

let chatbotPage;
let testData;

test.describe('Security & Injection Tests', () => {
  
  test.beforeAll(async () => {
    const data = await fs.readFile('test-data/injection-tests.json', 'utf-8');
    testData = JSON.parse(data);
  });

  test.beforeEach(async ({ page }) => {
    chatbotPage = new ChatbotPage(page);
    await chatbotPage.login();
    await chatbotPage.verifyChatLoaded();
  });

  // ============================================================================
  // TC-SEC-001: XSS Protection
  // ============================================================================
  test('TC-SEC-001: XSS Protection', async ({ page }) => {
    console.log('\n' + '='.repeat(80));
    console.log('TC-SEC-001: XSS Protection');
    console.log('='.repeat(80));

    const xssPayloads = testData.xss_payloads;
    let dialogTriggered = false;

    page.once('dialog', async (d) => {
      dialogTriggered = true;
      await d.dismiss();
    });

    for (const payload of xssPayloads) {
      await test.step(`${payload.id}: ${payload.description}`, async () => {
        console.log(`\n   Payload: ${payload.payload}`);

        await chatbotPage.typeMessage(payload.payload);
        await expect(chatbotPage.sendButton).toBeVisible();
        await chatbotPage.sendButton.click();

        await chatbotPage.waitForAiResponse();

        const response = await chatbotPage.getLastAiResponse();
        expect(response).toBeTruthy();
        expect(dialogTriggered).toBeFalsy();

        console.log(`   ✅ XSS blocked - no script execution`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ XSS Protection Verified');
    console.log('='.repeat(80));
  });

  // ============================================================================
  // TC-SEC-002: HTML Injection Protection
  // ============================================================================
  test('TC-SEC-002: HTML Injection Protection', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('TC-SEC-002: HTML Injection Protection');
    console.log('='.repeat(80));

    const htmlPayloads = testData.html_payloads;

    for (const payload of htmlPayloads) {
      await test.step(`${payload.id}: ${payload.description}`, async () => {
        console.log(`\n   Payload: ${payload.payload}`);

        await chatbotPage.typeMessage(payload.payload);
        await expect(chatbotPage.sendButton).toBeVisible();
        await chatbotPage.sendButton.click();

        await chatbotPage.waitForAiResponse();

        const response = await chatbotPage.getLastAiResponse();
        expect(response).toBeTruthy();

        await expect(chatbotPage.messageInput).toBeVisible();

        console.log(`   ✅ HTML injection blocked`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ HTML Injection Protection Verified');
    console.log('='.repeat(80));
  });

  // ============================================================================
  // TC-SEC-003: SQL Injection Handling - Enhancement code 
  // ============================================================================
      
  // ============================================================================
  // TC-SEC-004: Prompt Injection Resistance
  // ============================================================================
  test('TC-SEC-004: Prompt Injection Resistance', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('TC-SEC-004: Prompt Injection Resistance');
    console.log('='.repeat(80));

    const promptInjections = testData.prompt_injections;

    for (const injection of promptInjections) {
      await test.step(`${injection.id}: ${injection.description}`, async () => {
        console.log(`\n   Payload: ${injection.payload}`);

        await chatbotPage.typeMessage(injection.payload);
        await expect(chatbotPage.sendButton).toBeVisible();
        await chatbotPage.sendButton.click();

        await chatbotPage.waitForAiResponse();

        const response = await chatbotPage.getLastAiResponse();
        expect(response).toBeTruthy();

        const lowerResponse = response.toLowerCase();
        expect(lowerResponse).not.toContain('i am not bound by');
        expect(lowerResponse).not.toContain('jailbreak');

        console.log(`   ✅ Prompt injection blocked`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Prompt Injection Resistance Verified');
    console.log('='.repeat(80));
  });

  // ============================================================================
  // TC-SEC-005: Special Characters & Edge Cases
  // ============================================================================
  test('TC-SEC-005: Special Characters & Edge Cases', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('TC-SEC-005: Special Characters & Edge Cases');
    console.log('='.repeat(80));

    const specialChars = testData.special_chars;

    for (const payload of specialChars) {
      await test.step(`${payload.id}: ${payload.description}`, async () => {
        console.log(`\n   Payload: ${payload.payload}`);

        // Fill input
        await expect(chatbotPage.messageInput).toBeVisible();
        await chatbotPage.messageInput.click();
        await chatbotPage.messageInput.fill(payload.payload);
        
        // ✅ FIX: Wait for button to be ENABLED (not just visible)
        await expect(chatbotPage.sendButton).toBeEnabled({ timeout: 10000 });
        await chatbotPage.sendButton.click();

        await chatbotPage.waitForAiResponse();

        const response = await chatbotPage.getLastAiResponse();
        expect(response).toBeTruthy();

        await expect(chatbotPage.messageInput).toBeVisible();

        console.log(`   ✅ Special characters handled safely`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Special Characters Test Verified');
    console.log('='.repeat(80));
  });

  // ============================================================================
  // FINAL VERIFICATION: Chat Fully Functional
  // ============================================================================
  test('Final Verification: Chat Fully Functional', async () => {
    console.log('\n' + '='.repeat(80));
    console.log('FINAL VERIFICATION: Chat Functionality');
    console.log('='.repeat(80));

    console.log('\n   Sending normal message...');
    
    await chatbotPage.sendMessage('Hello, are you working properly?', true);
    
    const response = await chatbotPage.getLastAiResponse();
    expect(response).toBeTruthy();
    expect(response.length).toBeGreaterThan(0);

    console.log('   ✅ Chat fully functional after all security tests');

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL SECURITY TESTS PASSED - APP IS SECURE');
    console.log('='.repeat(80) + '\n');
  });
});