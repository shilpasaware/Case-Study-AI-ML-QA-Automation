#!/usr/bin/env node

/**
 * PromptFoo AI Validation - Self-Healing Quick Run
 * 
 * Features:
 * - Detects and fixes common errors
 * - Installs missing dependencies
 * - Validates API keys
 * - Runs entire workflow
 * - Provides detailed status at each step
 * 
 * Usage: node scripts/quick-run.js
 * 
 * Exit codes:
 * 0 = Success
 * 1 = Fatal error (cannot recover)
 * 2 = Success with warnings
 */

import { spawn } from 'child_process';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

class QuickRun {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.steps = [];
    this.exitCode = 0;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = {
      info: `${colors.cyan}ℹ${colors.reset}`,
      success: `${colors.green}✅${colors.reset}`,
      error: `${colors.red}❌${colors.reset}`,
      warn: `${colors.yellow}⚠️${colors.reset}`,
      step: `${colors.blue}📝${colors.reset}`,
      run: `${colors.bold}▶${colors.reset}`
    }[type] || `${colors.blue}•${colors.reset}`;

    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  // ============================================================================
  // STEP 1: PRE-FLIGHT CHECKS
  // ============================================================================
  
  async checkPrerequisites() {
    this.log('STEP 1: Pre-flight Checks', 'step');
    
    // Check Node.js
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf-8' }).trim();
      this.log(`Node.js: ${nodeVersion}`, 'success');
    } catch (e) {
      this.errors.push('Node.js not installed or not in PATH');
      this.log('Node.js not found', 'error');
      return false;
    }

    // Check npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
      this.log(`npm: ${npmVersion}`, 'success');
    } catch (e) {
      this.errors.push('npm not installed');
      this.log('npm not found', 'error');
      return false;
    }

    // Check Python (optional but needed for report)
    try {
      const pythonVersion = execSync('python3 --version', { encoding: 'utf-8' }).trim();
      this.log(`Python: ${pythonVersion}`, 'success');
    } catch (e) {
      this.warnings.push('Python3 not found - report generation will be skipped');
      this.log('Python3 not found (optional)', 'warn');
    }

    // Check directory structure
    if (!fs.existsSync(path.join(PROJECT_ROOT, 'tests'))) {
      fs.mkdirSync(path.join(PROJECT_ROOT, 'tests'), { recursive: true });
      this.log('Created tests/ directory', 'info');
    }

    if (!fs.existsSync(path.join(PROJECT_ROOT, 'ai-evaluation'))) {
      fs.mkdirSync(path.join(PROJECT_ROOT, 'ai-evaluation'), { recursive: true });
      this.log('Created ai-evaluation/ directory', 'info');
    }

    if (!fs.existsSync(path.join(PROJECT_ROOT, 'scripts'))) {
      fs.mkdirSync(path.join(PROJECT_ROOT, 'scripts'), { recursive: true });
      this.log('Created scripts/ directory', 'info');
    }

    this.log('Pre-flight checks passed\n', 'success');
    return true;
  }

  // ============================================================================
  // STEP 2: VALIDATE ENVIRONMENT
  // ============================================================================

  async validateEnvironment() {
    this.log('STEP 2: Validate Environment', 'step');

    // Check OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY || '';
    
    if (!apiKey) {
      this.log('OPENAI_API_KEY not set in environment', 'warn');
      
      // Try to read from .env file
      const envFile = path.join(PROJECT_ROOT, '.env');
      if (fs.existsSync(envFile)) {
        const envContent = fs.readFileSync(envFile, 'utf-8');
        const match = envContent.match(/OPENAI_API_KEY=(.+)/);
        if (match) {
          process.env.OPENAI_API_KEY = match[1].trim();
          this.log('Loaded OPENAI_API_KEY from .env file', 'success');
        }
      } else {
        this.log('⚠️  CRITICAL: No OPENAI_API_KEY found', 'error');
        this.log('Set via: export OPENAI_API_KEY="sk-your-key"', 'info');
        this.warnings.push('OPENAI_API_KEY not configured - evaluation will fail');
        return false;
      }
    } else {
      const masked = `${apiKey.substring(0, 7)}...${apiKey.substring(-4)}`;
      this.log(`OPENAI_API_KEY: ${masked}`, 'success');
    }

    // Check package.json
    const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      this.log('package.json not found - creating one', 'warn');
      this.createPackageJson();
    } else {
      this.log('package.json found', 'success');
    }

    this.log('Environment validation complete\n', 'success');
    return true;
  }

  createPackageJson() {
    const packageJson = {
      name: 'u-ask-automation',
      version: '1.0.0',
      type: 'module',
      description: 'U-Ask Chatbot Automation & AI Validation',
      scripts: {
        'test:security': 'playwright test tests/security-injection.spec.js',
        'test:accessibility': 'playwright test tests/accessibility.spec.js',
        'test:ai': 'playwright test tests/ai-validation.spec.js',
        'test:all': 'playwright test',
        'eval:ai': 'npm run test:ai && node scripts/response-collector.js && promptfoo eval && python3 scripts/report_generator.py',
        'quick-run': 'node scripts/quick-run.js'
      },
      devDependencies: {
        '@playwright/test': '^1.40.0',
        'promptfoo': '^0.61.0',
        'dotenv': '^16.3.1'
      }
    };

    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2)
    );
    this.log('Created package.json', 'success');
  }

  // ============================================================================
  // STEP 3: INSTALL DEPENDENCIES
  // ============================================================================

  async installDependencies() {
    this.log('STEP 3: Install Dependencies', 'step');

    const dependencies = ['@playwright/test', 'promptfoo', 'dotenv'];

    for (const dep of dependencies) {
      try {
        require.resolve(dep);
        this.log(`${dep}: already installed`, 'success');
      } catch {
        this.log(`Installing ${dep}...`, 'info');
        try {
          execSync(`npm install ${dep} --save-dev`, {
            cwd: PROJECT_ROOT,
            stdio: 'pipe'
          });
          this.log(`${dep}: installed`, 'success');
        } catch (e) {
          this.log(`Failed to install ${dep}`, 'error');
          this.errors.push(`Failed to install ${dep}`);
          return false;
        }
      }
    }

    this.log('Dependencies check complete\n', 'success');
    return true;
  }

  // ============================================================================
  // STEP 4: VALIDATE TEST FILES
  // ============================================================================

  async validateTestFiles() {
    this.log('STEP 4: Validate Test Files', 'step');

    const requiredFiles = [
      'tests/ai-validation.spec.js',
      'promptfoo.yaml',
      'scripts/response-collector.js',
      'scripts/report_generator.py'
    ];

    let allFound = true;
    for (const file of requiredFiles) {
      const filePath = path.join(PROJECT_ROOT, file);
      if (fs.existsSync(filePath)) {
        this.log(`${file}: found`, 'success');
      } else {
        this.log(`${file}: NOT FOUND`, 'error');
        allFound = false;
      }
    }

    if (!allFound) {
      this.log('\nError: Missing test files', 'error');
      this.log('Please ensure all files are copied to the project root', 'info');
      return false;
    }

    this.log('All test files present\n', 'success');
    return true;
  }

  // ============================================================================
  // STEP 5: SYNTAX VALIDATION
  // ============================================================================

  async validateSyntax() {
    this.log('STEP 5: Syntax Validation', 'step');

    const jsFiles = [
      'tests/ai-validation.spec.js',
      'scripts/response-collector.js'
    ];

    for (const file of jsFiles) {
      const filePath = path.join(PROJECT_ROOT, file);
      try {
        execSync(`node --check "${filePath}"`, { stdio: 'pipe' });
        this.log(`${file}: syntax OK`, 'success');
      } catch (e) {
        this.log(`${file}: syntax error`, 'error');
        this.errors.push(`Syntax error in ${file}`);
        return false;
      }
    }

    this.log('Syntax validation passed\n', 'success');
    return true;
  }

  // ============================================================================
  // STEP 6: RUN PLAYWRIGHT TESTS
  // ============================================================================

  async runPlaywrightTests() {
    this.log('STEP 6: Run Playwright Tests (Collect Responses)', 'step');
    this.log('This may take 3-5 minutes...', 'info');

    return new Promise((resolve) => {
      const proc = spawn('npx', ['playwright', 'test', 'tests/ai-validation.spec.js'], {
        cwd: PROJECT_ROOT,
        stdio: 'inherit'
      });

      proc.on('close', (code) => {
        if (code === 0) {
          this.log('Playwright tests passed', 'success');
          
          // Verify responses were collected
          const responsesFile = path.join(PROJECT_ROOT, 'ai-evaluation/collected-responses.json');
          if (fs.existsSync(responsesFile)) {
            const responses = JSON.parse(fs.readFileSync(responsesFile, 'utf-8'));
            this.log(`Collected ${responses.length} responses`, 'success');
            resolve(true);
          } else {
            this.log('Warning: No responses collected', 'warn');
            this.warnings.push('Playwright tests did not save responses');
            resolve(true);
          }
        } else {
          this.log('Playwright tests failed', 'error');
          this.errors.push('Playwright test execution failed');
          resolve(false);
        }
      });

      proc.on('error', (err) => {
        this.log(`Error running Playwright: ${err.message}`, 'error');
        this.errors.push(`Playwright execution error: ${err.message}`);
        resolve(false);
      });
    });
  }

  // ============================================================================
  // STEP 7: FORMAT RESPONSES
  // ============================================================================

  async formatResponses() {
    this.log('STEP 7: Format Responses for PromptFoo', 'step');

    return new Promise((resolve) => {
      const proc = spawn('node', ['scripts/response-collector.js'], {
        cwd: PROJECT_ROOT,
        stdio: 'inherit'
      });

      proc.on('close', (code) => {
        if (code === 0) {
          this.log('Response formatting successful', 'success');
          resolve(true);
        } else {
          this.log('Response formatting failed', 'error');
          this.errors.push('Response collector failed');
          resolve(false);
        }
      });

      proc.on('error', (err) => {
        this.log(`Error in response collector: ${err.message}`, 'error');
        this.errors.push(`Response collector error: ${err.message}`);
        resolve(false);
      });
    });
  }

  // ============================================================================
  // STEP 8: RUN PROMPTFOO EVALUATION
  // ============================================================================

  async runPromptFooEvaluation() {
    this.log('STEP 8: Run PromptFoo Evaluation (GPT-4)', 'step');
    this.log('This may take 2-3 minutes... (using GPT-4 API)', 'info');

    return new Promise((resolve) => {
      const proc = spawn('npx', ['promptfoo', 'eval'], {
        cwd: PROJECT_ROOT,
        stdio: 'inherit',
        env: { ...process.env, OPENAI_API_KEY: process.env.OPENAI_API_KEY }
      });

      proc.on('close', (code) => {
        if (code === 0) {
          this.log('PromptFoo evaluation successful', 'success');
          resolve(true);
        } else {
          this.log('PromptFoo evaluation failed', 'error');
          this.errors.push('PromptFoo evaluation failed');
          resolve(false);
        }
      });

      proc.on('error', (err) => {
        this.log(`Error running PromptFoo: ${err.message}`, 'error');
        this.errors.push(`PromptFoo execution error: ${err.message}`);
        resolve(false);
      });
    });
  }

  // ============================================================================
  // STEP 9: GENERATE HTML REPORT
  // ============================================================================

  async generateReport() {
    this.log('STEP 9: Generate HTML Report', 'step');

    // Check if Python is available
    try {
      execSync('python3 --version', { stdio: 'pipe' });
    } catch {
      this.log('Python3 not available - skipping HTML report', 'warn');
      this.warnings.push('Python3 not available - HTML report generation skipped');
      return true;
    }

    return new Promise((resolve) => {
      const proc = spawn('python3', ['scripts/report_generator.py'], {
        cwd: PROJECT_ROOT,
        stdio: 'inherit'
      });

      proc.on('close', (code) => {
        if (code === 0) {
          this.log('HTML report generated', 'success');
          
          const reportFile = path.join(PROJECT_ROOT, 'ai-evaluation/report.html');
          if (fs.existsSync(reportFile)) {
            this.log(`Report saved to: ai-evaluation/report.html`, 'success');
          }
          resolve(true);
        } else {
          this.log('Report generation failed', 'warn');
          this.warnings.push('HTML report generation failed');
          resolve(true); // Don't fail completely
        }
      });

      proc.on('error', (err) => {
        this.log(`Error generating report: ${err.message}`, 'warn');
        this.warnings.push(`Report generation error: ${err.message}`);
        resolve(true); // Don't fail completely
      });
    });
  }

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================

  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log(`${colors.bold}EXECUTION SUMMARY${colors.reset}`);
    console.log('='.repeat(80));

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(`\n${colors.green}${colors.bold}✅ ALL STEPS COMPLETED SUCCESSFULLY!${colors.reset}\n`);
      this.exitCode = 0;
    } else if (this.errors.length === 0) {
      console.log(`\n${colors.yellow}${colors.bold}⚠️  COMPLETED WITH WARNINGS${colors.reset}\n`);
      this.exitCode = 2;
    } else {
      console.log(`\n${colors.red}${colors.bold}❌ COMPLETED WITH ERRORS${colors.reset}\n`);
      this.exitCode = 1;
    }

    if (this.errors.length > 0) {
      console.log(`${colors.red}Errors (${this.errors.length}):${colors.reset}`);
      this.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
      console.log();
    }

    if (this.warnings.length > 0) {
      console.log(`${colors.yellow}Warnings (${this.warnings.length}):${colors.reset}`);
      this.warnings.forEach((warn, i) => {
        console.log(`  ${i + 1}. ${warn}`);
      });
      console.log();
    }

    console.log(`${colors.bold}📊 Generated Files:${colors.reset}`);
    const files = [
      'ai-evaluation/collected-responses.json',
      'ai-evaluation/promptfoo-tests.json',
      'ai-evaluation/promptfoo-results.json',
      'ai-evaluation/report.html'
    ];

    for (const file of files) {
      const filePath = path.join(PROJECT_ROOT, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const size = (stats.size / 1024).toFixed(2);
        console.log(`  ✅ ${file} (${size} KB)`);
      } else {
        console.log(`  ⏭️  ${file} (not generated)`);
      }
    }

    console.log();
    console.log(`${colors.bold}📝 Next Steps:${colors.reset}`);
    if (fs.existsSync(path.join(PROJECT_ROOT, 'ai-evaluation/report.html'))) {
      console.log(`  1. View report: ${colors.cyan}open ai-evaluation/report.html${colors.reset}`);
    }
    console.log(`  2. Review results in ${colors.cyan}ai-evaluation/${colors.reset}`);
    console.log(`  3. Check detailed logs above for any issues\n`);

    console.log('='.repeat(80) + '\n');
  }

  // ============================================================================
  // MAIN RUN
  // ============================================================================

  async run() {
    console.clear();
    console.log(`${colors.bold}${colors.cyan}🚀 PromptFoo AI Validation - Self-Healing Quick Run${colors.reset}\n`);

    try {
      // Run all steps
      if (!await this.checkPrerequisites()) {
        this.exitCode = 1;
      } else if (!await this.validateEnvironment()) {
        this.exitCode = 1;
      } else if (!await this.installDependencies()) {
        this.exitCode = 1;
      } else if (!await this.validateTestFiles()) {
        this.exitCode = 1;
      } else if (!await this.validateSyntax()) {
        this.exitCode = 1;
      } else if (!await this.runPlaywrightTests()) {
        this.exitCode = 1;
      } else if (!await this.formatResponses()) {
        this.exitCode = 1;
      } else if (!await this.runPromptFooEvaluation()) {
        this.exitCode = 1;
      } else {
        await this.generateReport();
      }
    } catch (err) {
      this.log(`Unexpected error: ${err.message}`, 'error');
      this.errors.push(`Unexpected error: ${err.message}`);
      this.exitCode = 1;
    }

    this.printSummary();
    process.exit(this.exitCode);
  }
}

// Run the quick-run script
const quickRun = new QuickRun();
quickRun.run();
