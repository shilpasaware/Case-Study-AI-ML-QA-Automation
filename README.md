U-Ask UAE Government Chatbot
AI / ML QA Automation Framework

(Assessment Submission)

End-to-End AI QA Automation Framework
Built to validate real chatbot UI behavior and AI response quality under real user conditions.

📌 Overview

This repository contains a completed AI/ML QA automation framework for the U-Ask UAE Government Chatbot, created as part of a technical assessment.

The framework focuses on what truly matters in production AI systems:

Is the chatbot UI stable and usable?

Does the AI return a real, final answer (not a loading placeholder)?

Is the response helpful, relevant, and safe?

Does it work correctly in English and Arabic?

Does it gracefully handle complex and out-of-scope questions?

The solution intentionally avoids mocks and validates the chatbot through real UI interaction.

🧠 High-Level Design

Tools Used

Playwright → UI automation (real browser, real chatbot)

Promptfoo → AI/LLM response evaluation using rule-based assertions

JavaScript assertions → deterministic, explainable AI checks

How it works

Promptfoo reads YAML test cases

Each test calls a custom Playwright provider

Provider:

Logs into the chatbot

Sends the question

Waits for the final AI response

Returns the response text to Promptfoo

Promptfoo validates the response using QA rules

🧱 Project Structure (Actual)
u-ask-automation/
│
├── .github/workflows/
│   └── ci.yml                     # CI pipeline
│
├── promptfoo/
│   ├── providers/
│   │   └── uask-chatbot-provider.js
│   ├── tests/
│   │   ├── 1_basic/
│   │   ├── 2_moderate/
│   │   └── 3_advanced/
│   ├── promptfooconfig.yaml
│   ├── promptfooconfig-moderate.yaml
│   ├── promptfooconfig-advanced.yaml
│   └── promptfooconfig-negative.yaml
│
├── tests/                         # Playwright UI tests
│   ├── ui-behavior.spec.js
│   ├── chat.spec.js
│   ├── ai-response-validation.spec.js
│   └── security-injection.spec.js
│
├── test-data/
│   ├── prompts-en.json
│   ├── prompts-ar.json
│   ├── injection-tests.json
│   └── test-queries-full.json
│
├── utils/
│   ├── aiValidator.js
│   ├── config-loader.js
│   ├── data-processor.js
│   ├── logger.js
│   └── testHelpers.js
│
├── playwright.config.js
├── package.json
├── .env (not committed)
└── README.md

🎯 What This Framework Validates
✅ UI Automation (Playwright)

Chat widget loads correctly

User can type and send messages

AI responses render correctly

Input clears after sending

Scroll behavior works

English (LTR) and Arabic (RTL) layouts

Basic accessibility & usability

Security checks:

XSS

Prompt injection

Malicious input handling

✅ AI / LLM Validation (Promptfoo)

A test PASS only when:

✔ Chatbot finishes loading
✔ Placeholder text disappears
✔ A real answer is shown
✔ Response is long enough
✔ Response is relevant to the question
✔ No retry / error / fallback message is returned


⚙️ Installation
Prerequisites

Node.js 18+

npm 9+

node -v
npm -v

Install dependencies
npm install
npx playwright install --with-deps

🔐 Environment Setup

Create a .env file:

BASE_URL=https://govgpt.sandbox.dge.gov.ae/
USERNAME=qatest1@dge.gov.ae
PASSWORD=DGEUser100!
HEADLESS=true
TEST_TIMEOUT=180000

▶️ How to Run
Run Playwright UI tests
npx playwright test

Run Promptfoo AI tests
npm run promptfoo:basic
npm run promptfoo:moderate
npm run promptfoo:advanced


View results:

npx promptfoo view

🧪 Key QA Design Decisions
✔ Robust Auto-Waiting

No waitForTimeout

Uses polling + stability checks

Ensures response is final, not streaming

✔ Deterministic Assertions

Explicit true / false returns

Avoids flaky or subjective checks

✔ Serialized Execution

Concurrency = 1

Prevents UI session instability

✔ Honest QA Scope

Tests behavior & quality, not “perfect answers”

⚠️ Intentionally Not Covered
Area	Reason
Factual truth verification	Requires external knowledge base
Exact answer matching	LLMs are non-deterministic
Multi-turn memory	Promptfoo is single-turn
Source citations	Not supported by chatbot UI
Token-level streaming	Abstracted by UI

Hallucinations are approximated via relevance & structure, which reflects real-world AI QA practice.

📊 Assessment Summary

UI Automation → ✅ Covered

AI Response Quality → ✅ Covered

Arabic + English → ✅ Covered

Security & Injection → ✅ Covered

Complex Queries → ✅ Covered

CI-Ready → ✅ Included

👩‍💻 Author

Shilpa Saware
Senior QA Engineer


✅ Assessment Status

✔ Completed
✔ Production-oriented


