# 🤖 U-Ask UAE Government Chatbot - AI/ML QA Automation Framework

[![Playwright Tests](https://img.shields.io/badge/Playwright-Tests-green.svg)](https://playwright.dev/)
[![DeepEval](https://img.shields.io/badge/DeepEval-AI%20Metrics-blue.svg)](https://deepeval.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Professional End-to-End Automated Testing Framework for AI-Powered Chatbot**  
> *Comprehensive UI, AI Response, and Security Validation with Industry-Standard Reporting*

---

## 📋 Table of Contents
- [Overview](#overview)
- [Test Coverage](#test-coverage)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Test Execution](#test-execution)
- [Reporting](#reporting)
- [Project Structure](#project-structure)
- [CI/CD Integration](#cicd-integration)

---

## 🎯 Overview

This framework provides comprehensive automated testing for the **U-Ask UAE Government Chatbot**, covering:

- ✅ **UI Behavior Validation** - Widget loading, interactions, responsiveness
- ✅ **AI Response Quality** - Hallucination detection, relevancy, consistency
- ✅ **Security Testing** - XSS, SQL injection, prompt injection
- ✅ **Multilingual Support** - English (LTR) and Arabic (RTL) testing
- ✅ **Cross-Browser Testing** - Chrome, Firefox, Safari
- ✅ **Mobile Responsiveness** - iPhone, Android devices
- ✅ **AI/ML Metrics** - 12 DeepEval metrics for comprehensive AI evaluation

**Total Test Coverage: 27 Playwright Tests + 12 DeepEval Metrics**

---

## 📊 Test Coverage

### Playwright Test Suite (27 Tests)

| Test Category | Count | Coverage |
|--------------|-------|----------|
| **UI Behavior** | 8 | Chat widget, input/output, loading states, accessibility |
| **AI Response Validation** | 10 | Relevancy, hallucination, consistency, quality metrics |
| **Security & Injection** | 5 | XSS, SQL injection, prompt injection, jailbreak attempts |
| **Cross-Browser & Mobile** | 4 | Chrome, Firefox, iPhone, Android responsiveness |

### DeepEval AI Metrics (12 Metrics)

| Metric | Purpose |
|--------|---------|
| **Hallucination Detection** | Ensures no fabricated information |
| **Answer Relevancy** | Validates response addresses query |
| **Faithfulness** | Verifies grounding in context |
| **Contextual Precision** | Measures context ranking quality |
| **Contextual Recall** | Ensures full context utilization |
| **Contextual Relevancy** | Validates context appropriateness |
| **Bias Detection** | Ensures neutral responses |
| **Toxicity Check** | Validates respectful communication |
| **Helpfulness (G-Eval)** | Custom metric for actionability |
| **Completeness (G-Eval)** | Validates comprehensive answers |
| **Clarity (G-Eval)** | Ensures clear communication |
| **Accuracy (G-Eval)** | Verifies factual correctness |

---

## 🛠 Technology Stack
```
Playwright v1.42       - E2E testing framework
DeepEval v0.21        - AI/ML evaluation metrics
Allure v2.27          - Professional test reporting
Node.js v18+          - Runtime environment
Python 3.9+           - DeepEval execution
```

---

## 🚀 Quick Start

### Prerequisites
```bash
node --version  # v18.0.0 or higher
python --version  # 3.9 or higher
```

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/u-ask-automation.git
cd u-ask-automation

# Install Node dependencies
npm install

# Install Playwright browsers
npx playwright install

# Install Python dependencies
pip install -r requirements.txt

# Login to DeepEval (for Confident AI dashboard)
deepeval login
```

### Environment Setup

Create `.env` file:
```env
# OpenAI API Key for DeepEval metrics
OPENAI_API_KEY=your_openai_api_key_here

# Test Configuration
BASE_URL=https://ask.u.ae
TEST_TIMEOUT=60000
```

---

## ▶️ Test Execution

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# UI tests only
npm run test:ui

# AI validation tests
npm run test:ai-validation

# Security tests
npm run test:security

# Cross-browser tests
npm run test:chrome
npm run test:firefox
npm run test:mobile
```

### Run with UI Mode (Visual Debugging)
```bash
npm run test:ui
```

### Run DeepEval AI Metrics
```bash
# Run all DeepEval tests
npm run deepeval

# Run specific metrics
cd ai-evaluation
deepeval test run deepeval-tests.py::test_hallucination_metric
```

### Run Complete Test Suite (Playwright + DeepEval)
```bash
npm run test:all
```

---

## 📈 Reporting

### Playwright HTML Report
```bash
# Generate and open HTML report
npm run report
```
Report location: `reports/playwright-html/index.html`

### Allure Report (Professional)
```bash
# Generate Allure report
npm run allure:generate

# Open Allure report in browser
npm run allure:open
```
Report location: `allure-report/index.html`

**Allure Features:**
- ✅ Test execution timeline
- ✅ Test categories (UI, AI, Security)
- ✅ Screenshot attachments on failure
- ✅ Video recordings
- ✅ Trends and history
- ✅ Suites and behaviors view

### DeepEval Confident AI Dashboard
```bash
# Login and view results online
deepeval login

# Tests automatically sync to dashboard
# Visit: https://app.confident-ai.com
```

**Confident AI Features:**
- ✅ Real-time metric visualization
- ✅ Test case management
- ✅ Regression tracking
- ✅ AI model comparison
- ✅ Team collaboration

---

## 📁 Project Structure
```
u-ask-chatbot-automation/
├── pages/                          # Page Object Models
│   ├── BasePage.js
│   └── ChatbotPage.js
├── tests/                          # Test Specifications
│   ├── ui-behavior.spec.js         (8 tests)
│   ├── ai-response-validation.spec.js  (10 tests)
│   ├── security-injection.spec.js  (5 tests)
│   └── cross-browser-mobile.spec.js  (4 tests)
├── utils/                          # Helper Utilities
│   ├── aiValidator.js
│   └── testHelpers.js
├── ai-evaluation/                  # DeepEval AI Metrics
│   ├── deepeval-tests.py           (12 metrics)
│   ├── test-cases.json
│   └── playwright-results.json
├── test-data/                      # Test Data
│   ├── prompts-en.json
│   ├── prompts-ar.json
│   └── injection-tests.json
├── reports/                        # Test Reports
│   ├── playwright-html/
│   ├── screenshots/
│   ├── videos/
│   └── test-results.json
├── allure-results/                 # Allure Raw Results
├── allure-report/                  # Allure HTML Report
├── playwright.config.js            # Playwright Configuration
├── pytest.ini                      # Pytest Configuration
├── package.json                    # Node Dependencies
├── requirements.txt                # Python Dependencies
├── .env                            # Environment Variables
└── README.md                       # Documentation
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow
```yaml
name: U-Ask Chatbot Tests

on: [push, pull_request]

jobs:
  playwright-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: allure-results
          path: allure-results/
  
  deepeval-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - run: pip install -r requirements.txt
      - run: cd ai-evaluation && deepeval test run deepeval-tests.py
```

---

## 📝 Test Summary

### Execution Metrics
- **Total Tests**: 27 Playwright + 12 DeepEval = **39 Total Tests**
- **Estimated Execution Time**: 15-20 minutes
- **Coverage**: UI (30%), AI Validation (37%), Security (19%), Cross-Browser (14%)

### Quality Gates
- ✅ All UI interactions must work flawlessly
- ✅ AI responses must score > 0.7 on all metrics
- ✅ Zero security vulnerabilities tolerated
- ✅ Cross-browser compatibility verified
- ✅ Mobile responsiveness confirmed

---

## 👤 Author

**Shilpa** - Senior QA Automation Engineer  
*Specialization: AI/ML Testing, Playwright Automation, Test Strategy*

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

This is an assessment project. For inquiries, please contact the author.

---

**Last Updated**: December 2024  
**Framework Version**: 1.0.0  
**Playwright Version**: 1.42.0  
**DeepEval Version**: 0.21.73

//-------------------------------------------------------------------------------------------------------

U-Ask UAE Government Chatbot – AI QA Automation Framework
📌 Overview

This repository contains an end-to-end AI QA automation framework for the U-Ask UAE Government Chatbot, built using:

Playwright (UI automation)

Promptfoo (LLM/AI response evaluation)

JavaScript-based assertions

Robust auto-waiting logic (no static sleeps)

The framework validates UI behavior, AI response quality, and content reliability under real user conditions.

🧠 Architecture Summary

u-ask-automation/
│
├── providers/
│   └── uask-chatbot-provider.js   # Playwright-based Promptfoo provider
│
├── tests/
│   ├── 1_basic/
│   │   └── basic_test.yaml        # Core AI response checks
│   ├── 2_moderate/
│   │   └── moderate_test.yaml     # Language, fallback, response quality
│   └── 3_advanced/
│       └── advanced_test.yaml     # Complex & multi-topic queries
│
├── promptfoo/
│   ├── promptfooconfig.yaml
│   ├── promptfooconfig-moderate.yaml
│   └── promptfooconfig-advanced.yaml
│
├── .env
├── package.json
└── README.md
⚙️ Key Design Decisions (Latest Updates)
✅ Robust Auto-Waiting (Provider Fix)

The Playwright provider waits only for a real, final AI response, ensuring:

Loading / placeholder text is gone

Response is stable (not streaming)

No system or retry errors

Meaningful length is reached

❌ No waitForTimeout()
✅ Uses expect.poll() + stability checks

✅ Assertion Reliability Fixes

All Promptfoo JavaScript assertions now:

Explicitly return true / false

Avoid false negatives caused by:

Missing returns

Over-strict formatting rules

Legitimate usage of the word “error” in normal advice

✅ Concurrency & Timeout Stability

Concurrency forced to 1

Timeout standardized to 180s

Prevents flaky UI behavior and browser closure issues

✅ Coverage Matrix (What is Covered)
🟢 Functional & AI Quality Coverage
Area	Covered
Clear & helpful responses	✅
Clean formatting (steps, bullets, sections)	✅
Placeholder / loading detection	✅
Fallback handling (out-of-scope questions)	✅
Arabic language response	✅
English response quality	✅
Contextual relevance	✅
Complex & multi-topic queries	✅
Error / retry message detection	✅
🟢 Test Levels
1️⃣ Basic Tests

Government services

License renewal

Visa documents

Business registration

Step-by-step validation

2️⃣ Moderate Tests

Fallback behavior

Arabic responses

General response quality

Non-refusal, non-hallucinated answers

3️⃣ Advanced Tests

New resident onboarding

Trade license documentation

Multi-topic queries
(Visa + School enrollment + Health insurance)

⚠️ Intentionally Not Covered (Yet)

These are explicitly out of scope for the current implementation and documented intentionally:

Area	Status	Reason
True hallucination detection	❌	Requires factual verification or external data sources
Answer consistency across runs	❌	LLM responses are probabilistic
Multi-turn conversational memory	❌	Promptfoo is single-turn by default
Source citation enforcement	❌	Not supported by chatbot UI
Token-level streaming validation	❌	UI abstracts streaming chunks

🔍 Note: Hallucination checks are approximated via relevance & structure, not factual truth.

▶️ How to Run Tests
Install dependencies
npm install

Run Basic Tests
npm run promptfoo:basic

Run Moderate Tests
npm run promptfoo:moderate

Run Advanced Tests
npm run promptfoo:advanced

🧪 Evaluation Philosophy

This framework is designed to answer real QA questions:

“Is the chatbot behaving correctly for an end user?”

Rather than verifying exact answers, it validates:

Completeness

Relevance

Language correctness

UX stability

Error-free responses

This mirrors production AI QA best practices.

Future Enhancements (Optional)

Multi-turn context validation

Hallucination detection using reference datasets

Source citation enforcement

Performance & latency benchmarks

CI/CD integration (GitHub Actions)

👩‍💻 Author

Shilpa Saware
Senior QA 
