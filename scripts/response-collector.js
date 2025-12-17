#!/usr/bin/env node

/**
 * Response Collector - Formats Playwright responses for PromptFoo
 * 
 * Usage: node scripts/response-collector.js
 * 
 * Reads: ai-evaluation/collected-responses.json
 * Outputs: ai-evaluation/promptfoo-tests.json
 */

import fs from 'fs';
import path from 'path';

const INPUT_FILE = 'ai-evaluation/collected-responses.json';
const OUTPUT_FILE = 'ai-evaluation/promptfoo-tests.json';

console.log('🔄 Response Collector - Formatting for PromptFoo\n');

// Check if input file exists
if (!fs.existsSync(INPUT_FILE)) {
  console.error(`❌ Error: ${INPUT_FILE} not found`);
  console.log('   Run Playwright tests first: npx playwright test tests/ai-validation.spec.js');
  process.exit(1);
}

// Read collected responses
console.log(`📖 Reading responses from: ${INPUT_FILE}`);
const collectedResponses = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf-8'));
console.log(`✅ Found ${collectedResponses.length} responses\n`);

// Format for PromptFoo
const promptfooTests = collectedResponses.map((item, index) => ({
  // Unique test ID
  id: `test-${item.id}`,
  
  // Input is the query
  input: {
    prompt: item.query
  },
  
  // Expected output is the actual response
  expected: item.response,
  
  // Metadata for reporting
  metadata: {
    id: item.id,
    language: item.language,
    category: item.category,
    timestamp: item.timestamp
  }
}));

// Write to output file
console.log(`📝 Formatting ${promptfooTests.length} tests for PromptFoo...`);

const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(promptfooTests, null, 2));

console.log(`✅ Formatted tests saved to: ${OUTPUT_FILE}\n`);

// Print summary
console.log('📊 Summary:');
console.log(`   Total tests: ${promptfooTests.length}`);
console.log(`   English: ${collectedResponses.filter(r => r.language === 'en').length}`);
console.log(`   Arabic: ${collectedResponses.filter(r => r.language === 'ar').length}`);

console.log('\n✅ Next step: npx promptfoo eval\n');
