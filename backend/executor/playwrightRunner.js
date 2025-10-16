/**
 * Playwright Test Runner - Executes test plans using Playwright
 * 
 * This module takes a structured test plan and executes it step by step
 * using Playwright browser automation. It handles failures, retries,
 * captures screenshots and videos, and logs all actions.
 */

import { chromium, firefox, webkit } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { ensureDirectoryExists } from '../utils/helpers.js';

class PlaywrightRunner {
  constructor(config) {
    this.config = config;
    this.browser = null;
    this.context = null;
    this.page = null;
    this.artifactsDir = path.join(process.cwd(), config.paths.artifacts);
    this.currentTestId = null;
  }

  /**
   * Execute a test plan
   * @param {Object} testPlan - Complete test plan from TestPlanner
   * @returns {Promise<Object>} Test results
   */
  async executeTestPlan(testPlan) {
    console.log(`\n🚀 Starting test execution: ${testPlan.name}`);
    console.log(`   Test ID: ${testPlan.id}`);
    
    this.currentTestId = testPlan.id;
    const startTime = Date.now();
    
    const results = {
      testId: testPlan.id,
      testName: testPlan.name,
      intent: testPlan.intent,
      startedAt: new Date().toISOString(),
      completedAt: null,
      duration: null,
      status: 'running',
      totalSteps: testPlan.steps.length,
      passedSteps: 0,
      failedSteps: 0,
      skippedSteps: 0,
      steps: [],
      screenshots: [],
      videos: [],
      logs: [],
      error: null
    };
    
    try {
      // Setup browser
      await this.setup(testPlan.config);
      
      // Execute each step
      for (const step of testPlan.steps) {
        const stepResult = await this.executeStep(step);
        results.steps.push(stepResult);
        
        if (stepResult.status === 'passed') {
          results.passedSteps++;
        } else if (stepResult.status === 'failed') {
          results.failedSteps++;
          
          // Capture failure artifacts
          if (testPlan.config.screenshotOnFailure) {
            const screenshot = await this.captureScreenshot(step.id, 'failure');
            results.screenshots.push(screenshot);
            stepResult.screenshot = screenshot;
          }
          
          // Stop on first failure (can be configurable)
          if (!step.optional) {
            results.error = `Test failed at step ${step.stepNumber}: ${step.description}`;
            break;
          }
        } else {
          results.skippedSteps++;
        }
      }
      
      // Determine overall status
      if (results.failedSteps > 0) {
        results.status = 'failed';
      } else if (results.passedSteps === results.totalSteps) {
        results.status = 'passed';
      } else {
        results.status = 'partial';
      }
      
      console.log(`\n${results.status === 'passed' ? '✅' : '❌'} Test ${results.status}: ${testPlan.name}`);
      console.log(`   Passed: ${results.passedSteps}/${results.totalSteps}`);
      console.log(`   Failed: ${results.failedSteps}`);
      
    } catch (error) {
      console.error('❌ Test execution error:', error.message);
      results.status = 'error';
      results.error = error.message;
      
    } finally {
      // Cleanup
      await this.teardown();
      
      results.completedAt = new Date().toISOString();
      results.duration = Date.now() - startTime;
      
      // Save results
      await this.saveResults(results);
    }
    
    return results;
  }

  /**
   * Execute a single test step
   * @param {Object} step - Test step
   * @returns {Promise<Object>} Step result
   */
  async executeStep(step) {
    console.log(`\n  Step ${step.stepNumber}: ${step.description}`);
    
    const stepResult = {
      id: step.id,
      stepNumber: step.stepNumber,
      description: step.description,
      action: step.action,
      status: 'running',
      startedAt: new Date().toISOString(),
      completedAt: null,
      duration: null,
      error: null,
      screenshot: null,
      retryCount: 0
    };
    
    const startTime = Date.now();
    let lastError = null;
    
    // Retry logic
    for (let attempt = 0; attempt <= step.retries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`    ↻ Retry ${attempt}/${step.retries}`);
          stepResult.retryCount = attempt;
          await this.page.waitForTimeout(1000); // Wait before retry
        }
        
        // Execute action based on type
        await this.performAction(step);
        
        // Success
        stepResult.status = 'passed';
        console.log(`    ✓ Passed`);
        break;
        
      } catch (error) {
        lastError = error;
        console.log(`    ✗ Attempt ${attempt + 1} failed: ${error.message}`);
        
        if (attempt === step.retries) {
          // All retries exhausted
          stepResult.status = 'failed';
          stepResult.error = error.message;
          console.log(`    ❌ Failed after ${step.retries} retries`);
        }
      }
    }
    
    stepResult.completedAt = new Date().toISOString();
    stepResult.duration = Date.now() - startTime;
    
    return stepResult;
  }

  /**
   * Perform action based on step type
   * @param {Object} step - Test step
   */
  async performAction(step) {
    const { action, target, data, assertion } = step;
    
    switch (action) {
      case 'navigate':
        await this.page.goto(target, { 
          waitUntil: 'domcontentloaded',
          timeout: step.timeout 
        });
        break;
        
      case 'click':
        await this.page.click(target, { timeout: step.timeout });
        break;
        
      case 'type':
        await this.page.fill(target, data, { timeout: step.timeout });
        break;
        
      case 'wait':
        if (target) {
          await this.page.waitForSelector(target, { 
            timeout: step.timeout,
            state: 'visible'
          });
        } else {
          await this.page.waitForTimeout(data || 1000);
        }
        break;
        
      case 'verify':
        await this.performVerification(target, assertion, step.timeout);
        break;
        
      case 'hover':
        await this.page.hover(target, { timeout: step.timeout });
        break;
        
      case 'select':
        await this.page.selectOption(target, data, { timeout: step.timeout });
        break;
        
      case 'press':
        await this.page.keyboard.press(data || target);
        break;
        
      default:
        throw new Error(`Unsupported action type: ${action}`);
    }
  }

  /**
   * Perform verification/assertion
   * @param {string} target - Element selector
   * @param {string} assertion - Assertion type
   * @param {number} timeout - Timeout in ms
   */
  async performVerification(target, assertion, timeout) {
    if (!assertion) {
      // Default: check element exists
      await this.page.waitForSelector(target, { timeout, state: 'attached' });
      return;
    }
    
    const lowerAssertion = assertion.toLowerCase();
    
    if (lowerAssertion.includes('visible')) {
      await this.page.waitForSelector(target, { timeout, state: 'visible' });
    } else if (lowerAssertion.includes('hidden') || lowerAssertion.includes('not visible')) {
      await this.page.waitForSelector(target, { timeout, state: 'hidden' });
    } else if (lowerAssertion.includes('text')) {
      const element = await this.page.waitForSelector(target, { timeout });
      const text = await element.textContent();
      
      // Extract expected text from assertion
      const match = assertion.match(/["']([^"']+)["']/);
      if (match && !text.includes(match[1])) {
        throw new Error(`Expected text "${match[1]}" not found`);
      }
    } else if (lowerAssertion.includes('url')) {
      const currentUrl = this.page.url();
      const match = assertion.match(/["']([^"']+)["']/);
      if (match && !currentUrl.includes(match[1])) {
        throw new Error(`Expected URL to contain "${match[1]}"`);
      }
    } else {
      // Default: element exists
      await this.page.waitForSelector(target, { timeout, state: 'attached' });
    }
  }

  /**
   * Setup browser and context
   * @param {Object} config - Test configuration
   */
  async setup(config) {
    console.log(`\n🌐 Launching ${config.browser} browser...`);
    
    await ensureDirectoryExists(this.artifactsDir);
    
    // Launch browser
    const browserType = config.browser === 'firefox' ? firefox : 
                       config.browser === 'webkit' ? webkit : chromium;
    
    this.browser = await browserType.launch({
      headless: config.headless || false,
      slowMo: 100 // Slow down for visibility
    });
    
    // Create context with video recording if needed
    const contextOptions = {
      viewport: { width: 1280, height: 720 },
      recordVideo: config.videoOnFailure ? {
        dir: path.join(this.artifactsDir, this.currentTestId, 'videos'),
        size: { width: 1280, height: 720 }
      } : undefined
    };
    
    this.context = await this.browser.newContext(contextOptions);
    this.page = await this.context.newPage();
    
    // Setup console logging
    this.page.on('console', msg => {
      console.log(`    [Browser Console] ${msg.type()}: ${msg.text()}`);
    });
    
    // Setup error logging
    this.page.on('pageerror', error => {
      console.error(`    [Browser Error] ${error.message}`);
    });
    
    console.log('   ✓ Browser ready');
  }

  /**
   * Teardown browser
   */
  async teardown() {
    console.log('\n🔒 Closing browser...');
    
    try {
      if (this.context) {
        await this.context.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      console.log('   ✓ Browser closed');
    } catch (error) {
      console.error('   ⚠️  Error closing browser:', error.message);
    }
  }

  /**
   * Capture screenshot
   * @param {string} stepId - Step ID
   * @param {string} type - Screenshot type (failure, step, etc.)
   * @returns {Promise<string>} Screenshot path
   */
  async captureScreenshot(stepId, type = 'step') {
    try {
      const screenshotDir = path.join(this.artifactsDir, this.currentTestId, 'screenshots');
      await ensureDirectoryExists(screenshotDir);
      
      const filename = `${stepId}_${type}_${Date.now()}.png`;
      const filepath = path.join(screenshotDir, filename);
      
      await this.page.screenshot({ 
        path: filepath,
        fullPage: true
      });
      
      console.log(`    📸 Screenshot saved: ${filename}`);
      return filepath;
      
    } catch (error) {
      console.error('    ⚠️  Failed to capture screenshot:', error.message);
      return null;
    }
  }

  /**
   * Save test results
   * @param {Object} results - Test results
   */
  async saveResults(results) {
    try {
      const resultsDir = path.join(process.cwd(), 'logs');
      await ensureDirectoryExists(resultsDir);
      
      const filename = `results_${results.testId}.json`;
      const filepath = path.join(resultsDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(results, null, 2));
      console.log(`\n💾 Results saved: ${filepath}`);
      
      // Also save latest results
      const latestPath = path.join(resultsDir, 'latest_results.json');
      await fs.writeFile(latestPath, JSON.stringify(results, null, 2));
      
    } catch (error) {
      console.error('❌ Failed to save results:', error.message);
    }
  }

  /**
   * Explain how the runner works
   */
  explain() {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                 PLAYWRIGHT RUNNER EXPLANATION                  ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Purpose: Execute test plans using browser automation         ║
║                                                                ║
║  Execution Flow:                                              ║
║  1. Launch browser (Chromium/Firefox/WebKit)                  ║
║  2. Create browser context with video recording               ║
║  3. Execute steps sequentially                                ║
║  4. Handle retries automatically on failure                   ║
║  5. Capture screenshots on failures                           ║
║  6. Log all actions and browser events                        ║
║  7. Generate structured results                               ║
║  8. Clean up and close browser                                ║
║                                                                ║
║  Supported Actions:                                           ║
║  - navigate: Go to URL                                        ║
║  - click: Click element                                       ║
║  - type: Fill input field                                     ║
║  - wait: Wait for element or timeout                          ║
║  - verify: Assert element state                               ║
║  - hover: Hover over element                                  ║
║  - select: Select dropdown option                             ║
║  - press: Press keyboard key                                  ║
║                                                                ║
║  Failure Handling:                                            ║
║  - Automatic retries (configurable)                           ║
║  - Screenshot capture on failure                              ║
║  - Video recording (if enabled)                               ║
║  - Detailed error messages                                    ║
║  - Optional steps can be skipped                              ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);
  }
}

export default PlaywrightRunner;

