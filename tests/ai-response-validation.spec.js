import { test, expect } from '@playwright/test';
import { ChatbotPage } from '../pages/ChatbotPage.js';
import { AIValidator } from '../utils/aiValidator.js';
import testDataEN from '../test-data/prompts-en.json' assert { type: 'json' };
import testDataAR from '../test-data/prompts-ar.json' assert { type: 'json' };
import fs from 'fs';

test.describe('AI Response Validation', () => {
    let chatbotPage;
    let aiValidator;
    let testResults = [];

    test.beforeEach(async ({ page }) => {
        chatbotPage = new ChatbotPage(page);
        aiValidator = new AIValidator();
        await chatbotPage.navigateToChatbot();
    });

    test.afterAll(async () => {
        // Save results for DeepEval
        fs.writeFileSync(
            'ai-evaluation/playwright-results.json',
            JSON.stringify(testResults, null, 2)
        );
    });

    test('TC-AI-001: Verify AI provides clear and helpful response to Emirates ID renewal query @smoke @ai', async () => {
        const testCase = testDataEN.common_queries[0];
        
        await test.step('Send Emirates ID renewal query', async () => {
            await chatbotPage.sendMessage(testCase.input);
            await chatbotPage.waitForBotResponse();
        });

        const response = await chatbotPage.getLastBotResponse();

        await test.step('Verify response contains expected keywords', async () => {
            const hasKeywords = testCase.expectedKeywords.some(keyword => 
                response.toLowerCase().includes(keyword.toLowerCase())
            );
            expect(hasKeywords, `Response should contain at least one of: ${testCase.expectedKeywords.join(', ')}`).toBe(true);
        });

        await test.step('Verify response does not contain error indicators', async () => {
            const hasErrors = testCase.shouldNotContain.some(keyword => 
                response.toLowerCase().includes(keyword.toLowerCase())
            );
            expect(hasErrors, 'Response should not contain error indicators').toBe(false);
        });

        await test.step('Verify response has substantial content', async () => {
            expect(response.length, 'Response should be at least 50 characters').toBeGreaterThan(50);
        });

        // Save for DeepEval
        testResults.push({
            query: testCase.input,
            response: response,
            category: testCase.category,
            timestamp: new Date().toISOString()
        });

        await chatbotPage.takeScreenshot('emirates-id-query-response');
    });

    test('TC-AI-002: Verify response is factual and not hallucinated @ai @hallucination', async () => {
        const query = 'How do I renew my Emirates ID?';
        
        await test.step('Send query about Emirates ID', async () => {
            await chatbotPage.sendMessage(query);
            await chatbotPage.waitForBotResponse();
        });

        const response = await chatbotPage.getLastBotResponse();

        await test.step('Verify mentions official entities', async () => {
            const officialEntities = ['ICP', 'Federal Authority', 'Emirates ID', 'Identity'];
            const mentionsOfficial = officialEntities.some(entity => 
                response.toLowerCase().includes(entity.toLowerCase())
            );
            expect(mentionsOfficial, 'Should mention official government entities').toBe(true);
        });

        await test.step('Verify no hallucination indicators', async () => {
            const hasHallucination = aiValidator.checkHallucinationIndicators(response);
            expect(hasHallucination, 'Should not contain uncertainty phrases').toBe(false);
        });

        testResults.push({
            query: query,
            response: response,
            category: 'hallucination_check',
            timestamp: new Date().toISOString()
        });

        await chatbotPage.takeScreenshot('factual-response-check');
    });

    test('TC-AI-003: Verify consistency - Similar intent queries get similar responses @ai @consistency', async () => {
        const testPair = testDataEN.consistency_test_pairs[0];
        
        await test.step('Send first query', async () => {
            await chatbotPage.sendMessage(testPair.query1);
            await chatbotPage.waitForBotResponse();
        });
        const response1 = await chatbotPage.getLastBotResponse();

        await test.step('Reset and send similar query', async () => {
            await chatbotPage.navigateToChatbot();
            await chatbotPage.sendMessage(testPair.query2);
            await chatbotPage.waitForBotResponse();
        });
        const response2 = await chatbotPage.getLastBotResponse();

        await test.step('Calculate semantic similarity', async () => {
            const similarity = aiValidator.calculateSimpleSimilarity(response1, response2);
            expect(similarity, `Similarity should be > 0.3 (got ${similarity.toFixed(2)})`).toBeGreaterThan(0.3);
        });

        testResults.push({
            query: `${testPair.query1} vs ${testPair.query2}`,
            response: `R1: ${response1.substring(0, 100)}... | R2: ${response2.substring(0, 100)}...`,
            category: 'consistency_check',
            timestamp: new Date().toISOString()
        });

        await chatbotPage.takeScreenshot('consistency-check');
    });

    test('TC-AI-004: Verify response formatting is clean without broken HTML @ai', async () => {
        await test.step('Send service hours query', async () => {
            await chatbotPage.sendMessage('What are the working hours for government services?');
            await chatbotPage.waitForBotResponse();
        });

        await test.step('Validate response formatting', async () => {
            const formatting = await chatbotPage.checkMessageFormatting(chatbotPage.botMessage);
            
            expect(formatting.hasScriptTags, 'Should not have script tags').toBe(false);
            expect(formatting.isComplete, 'Should have complete sentences').toBe(true);
        });

        const response = await chatbotPage.getLastBotResponse();
        testResults.push({
            query: 'Working hours query',
            response: response,
            category: 'formatting_check',
            timestamp: new Date().toISOString()
        });

        await chatbotPage.takeScreenshot('clean-formatting');
    });

    test('TC-AI-005: Verify fallback message for nonsense queries @ai @fallback', async () => {
        const nonsenseQuery = testDataEN.fallback_tests[0];
        
        await test.step('Send nonsense query', async () => {
            await chatbotPage.sendMessage(nonsenseQuery.input);
            await chatbotPage.waitForBotResponse();
        });

        const response = await chatbotPage.getLastBotResponse();

        await test.step('Verify contains fallback keywords', async () => {
            const hasFallback = nonsenseQuery.expectedResponse.some(keyword => 
                response.toLowerCase().includes(keyword.toLowerCase())
            );
            expect(hasFallback, 'Should provide helpful fallback message').toBe(true);
        });

        testResults.push({
            query: nonsenseQuery.input,
            response: response,
            category: 'fallback_handling',
            timestamp: new Date().toISOString()
        });

        await chatbotPage.takeScreenshot('fallback-message');
    });

    test('TC-AI-006: Verify Arabic query gets Arabic response @ai @multilingual', async () => {
        await test.step('Navigate to Arabic version', async () => {
            await chatbotPage.navigateToChatbot('https://ask.u.ae/ar/');
        });

        const testCase = testDataAR.common_queries[0];

        await test.step('Send Arabic query', async () => {
            await chatbotPage.sendMessage(testCase.input);
            await chatbotPage.waitForBotResponse();
        });

        const response = await chatbotPage.getLastBotResponse();

        await test.step('Verify response contains Arabic characters', async () => {
            const hasArabic = /[\u0600-\u06FF]/.test(response);
            expect(hasArabic, 'Response should contain Arabic text').toBe(true);
        });

        await test.step('Verify response contains expected keywords', async () => {
            const hasKeywords = testCase.expectedKeywords.some(keyword => response.includes(keyword));
            expect(hasKeywords, 'Should contain Arabic keywords').toBe(true);
        });

        testResults.push({
            query: testCase.input,
            response: response,
            category: 'arabic_response',
            timestamp: new Date().toISOString()
        });

        await chatbotPage.takeScreenshot('arabic-response');
    });

    test('TC-AI-007: Verify response quality metrics @ai @quality', async () => {
        await test.step('Send visa requirements query', async () => {
            await chatbotPage.sendMessage('What documents do I need for a UAE visa?');
            await chatbotPage.waitForBotResponse();
        });

        const response = await chatbotPage.getLastBotResponse();

        await test.step('Validate response quality', async () => {
            const quality = aiValidator.validateResponseQuality(response);
            
            expect(quality.hasContent, 'Response should have content').toBe(true);
            expect(quality.meetsMinLength, 'Response should meet minimum length').toBe(true);
            expect(quality.withinMaxLength, 'Response should be within max length').toBe(true);
            expect(quality.notTooShort, 'Response should have sufficient words').toBe(true);
            expect(quality.noRepeatedPhrases, 'Response should not have excessive repetition').toBe(true);
        });

        testResults.push({
            query: 'Visa requirements',
            response: response,
            category: 'quality_metrics',
            timestamp: new Date().toISOString()
        });

        await chatbotPage.takeScreenshot('quality-check');
    });

    test('TC-AI-008: Verify contextual relevance to user query @ai @relevance', async () => {
        const query = 'How to register a new business in Dubai?';
        const keywords = ['business', 'license', 'DED', 'register', 'Dubai'];
        
        await test.step('Send business registration query', async () => {
            await chatbotPage.sendMessage(query);
            await chatbotPage.waitForBotResponse();
        });

        const response = await chatbotPage.getLastBotResponse();

        await test.step('Check relevance to query', async () => {
            const relevance = aiValidator.checkRelevance(query, response, keywords);
            
            expect(relevance.isRelevant, 'Response should be relevant to query').toBe(true);
            expect(relevance.hasKeywords, 'Response should contain business-related keywords').toBe(true);
        });

        testResults.push({
            query: query,
            response: response,
            category: 'relevance_check',
            timestamp: new Date().toISOString()
        });

        await chatbotPage.takeScreenshot('relevance-check');
    });

    test('TC-AI-009: Verify multi-turn conversation context retention @ai @context', async () => {
        await test.step('Send initial query about Emirates ID', async () => {
            await chatbotPage.sendMessage('I want to renew my Emirates ID');
            await chatbotPage.waitForBotResponse();
        });

        const firstResponse = await chatbotPage.getLastBotResponse();

        await test.step('Send follow-up without full context', async () => {
            await chatbotPage.sendMessage('What documents do I need?');
            await chatbotPage.waitForBotResponse();
        });

        const secondResponse = await chatbotPage.getLastBotResponse();

        await test.step('Verify context is maintained', async () => {
            const mentionsEmiratesID = secondResponse.toLowerCase().includes('emirates id') ||
                                       secondResponse.toLowerCase().includes('identity');
            expect(mentionsEmiratesID, 'Should maintain Emirates ID context').toBe(true);
        });

        testResults.push({
            query: 'Multi-turn: Emirates ID renewal -> What documents',
            response: `First: ${firstResponse.substring(0, 50)}... | Second: ${secondResponse.substring(0, 50)}...`,
            category: 'context_retention',
            timestamp: new Date().toISOString()
        });

        await chatbotPage.takeScreenshot('context-retention');
    });

    test('TC-AI-010: Verify response completeness for complex queries @ai', async () => {
        const complexQuery = 'What are all the steps to start a business in UAE as a foreign investor?';
        
        await test.step('Send complex multi-part query', async () => {
            await chatbotPage.sendMessage(complexQuery);
            await chatbotPage.waitForBotResponse(45000); // Longer timeout for complex query
        });

        const response = await chatbotPage.getLastBotResponse();

        await test.step('Verify response addresses all aspects', async () => {
            const keywords = ['business', 'foreign', 'investor', 'license', 'visa', 'steps'];
            const keywordCoverage = keywords.filter(kw => 
                response.toLowerCase().includes(kw)
            ).length;
            
            expect(keywordCoverage, 'Should cover multiple aspects').toBeGreaterThanOrEqual(3);
            expect(response.length, 'Complex query should get detailed response').toBeGreaterThan(150);
        });

        testResults.push({
            query: complexQuery,
            response: response,
            category: 'complex_query',
            timestamp: new Date().toISOString()
        });

        await chatbotPage.takeScreenshot('complex-query-response');
    });
});