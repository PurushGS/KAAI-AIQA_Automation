/**
 * Phase 2: Test Executor with Screenshot & Logging
 * 
 * PURPOSE:
 * Executes test steps from Phase 1 while capturing screenshots
 * and logging expected vs actual behavior at each step.
 * 
 * CONNECTIONS:
 * - Input: Phase 1 test steps (JSON)
 * - Uses: Playwright for browser automation
 * - Output: Execution logs + screenshots + diff analysis
 * 
 * ARCHITECTURE:
 * Test Steps → For Each Step → Log Expected → Screenshot Before → Execute → 
 * Screenshot After → Log Actual → Compare → Generate Report
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Test Executor Class
 * Executes test steps with comprehensive logging and screenshot capture
 */
class TestExecutor {
  constructor() {
    this.browser = null;
    this.page = null;
    this.context = null;
    
    // Execution state
    // WHY: Track current test execution for logging
    this.currentTestId = null;
    this.currentStepNumber = 0;
    this.testStartTime = null;
    
    // Results collection
    // STRUCTURE: Array of step results with screenshots and logs
    this.stepResults = [];
    
    // Paths for artifacts
    // CONNECTION: Where we save screenshots and logs
    this.artifactsDir = './artifacts';
  }

  /**
   * Execute a complete test with steps from Phase 1
   * 
   * FLOW:
   * 1. Setup browser
   * 2. Execute each step with logging
   * 3. Capture screenshots before/after
   * 4. Compare expected vs actual
   * 5. Generate comprehensive report
   * 
   * @param {Array} testSteps - Structured steps from Phase 1
   * @param {Object} options - Execution options
   * @returns {Promise<Object>} - Complete test results
   */
  async executeTest(testSteps, options = {}) {
    console.log('\n🚀 Starting test execution with Screenshot & Logs');
    console.log(`   Total steps: ${testSteps.length}`);
    
    // Generate unique test ID
    // WHY: Organize artifacts by test execution
    this.currentTestId = uuidv4().substring(0, 8);
    this.testStartTime = Date.now();
    this.stepResults = [];
    
    try {
      // STEP 1: Setup browser
      await this.setupBrowser(options);
      
      // STEP 2: Execute each step
      for (let i = 0; i < testSteps.length; i++) {
        const step = testSteps[i];
        this.currentStepNumber = i + 1;
        
        console.log(`\n📍 Step ${this.currentStepNumber}/${testSteps.length}: ${step.description}`);
        
        // Execute step with full logging and screenshots
        const stepResult = await this.executeStep(step);
        this.stepResults.push(stepResult);
        
        // Stop on failure (configurable)
        if (stepResult.status === 'failed' && !options.continueOnFailure) {
          console.log('❌ Stopping execution due to failure');
          break;
        }
      }
      
      // STEP 3: Generate final report
      const report = await this.generateReport();
      
      console.log('\n✅ Test execution complete');
      console.log(`   Duration: ${Date.now() - this.testStartTime}ms`);
      console.log(`   Passed: ${report.passedSteps}/${report.totalSteps}`);
      
      return report;
      
    } catch (error) {
      console.error('❌ Test execution error:', error.message);
      
      return {
        success: false,
        error: error.message,
        testId: this.currentTestId,
        stepResults: this.stepResults
      };
      
    } finally {
      // CLEANUP: Always close browser
      await this.teardownBrowser();
    }
  }

  /**
   * Execute a single test step with complete logging
   * 
   * PURPOSE:
   * This is the core of Phase 2 - capturing everything about step execution
   * 
   * PROCESS:
   * 1. Log expected behavior (text only - highlighted in UI)
   * 2. Execute the action
   * 3. Capture result screenshot (success or failure)
   * 4. Log actual behavior
   * 5. Compare expected vs actual
   * 
   * @param {Object} step - Test step from Phase 1
   * @returns {Promise<Object>} - Step execution result
   */
  async executeStep(step) {
    const stepStartTime = Date.now();
    
    // Initialize step result
    // STRUCTURE: Complete information about step execution
    const result = {
      stepNumber: this.currentStepNumber,
      description: step.description,
      action: step.action,
      target: step.target,
      data: step.data,
      expected: step.expected,
      
      // Execution details
      status: 'running',
      startTime: new Date().toISOString(),
      endTime: null,
      duration: null,
      
      // Expected vs Actual logging
      // WHY: Core of Phase 2 - what we expected vs what happened
      expectedBehavior: '',
      actualBehavior: '',
      behaviorMatch: null,
      
      // Screenshots
      // WHY: Only capture result/failure, not before state (reduces clutter)
      screenshot: null,  // Success or failure screenshot
      
      // Error information
      error: null,
      errorDetails: null,
      
      // Page state
      // WHY: Context for debugging
      pageUrl: null,
      pageTitle: null,
      
      // Advanced Logging
      // WHY: Capture network and console errors that break pages
      consoleErrors: [],
      consoleWarnings: [],
      networkErrors: [],
      networkRequests: [],
      pageErrors: []
    };
    
    try {
      // STEP 1: Log expected behavior
      // WHY: Document what should happen for comparison
      result.expectedBehavior = this.getExpectedBehavior(step);
      console.log(`   Expected: ${result.expectedBehavior}`);
      
      // STEP 2: Capture page state before action
      result.pageUrl = this.page.url();
      result.pageTitle = await this.page.title();
      
      // STEP 3: Execute the action with AI auto-adaptation tracking
      const correctionDetails = await this.performAction(step);
      
      // Small delay to let page settle
      // WHY: Give dynamic content time to render
      await this.page.waitForTimeout(500);
      
      // STEP 4: No screenshot on success
      // WHY: Only capture failures to save resources and storage
      result.screenshot = null;
      console.log(`   ✅ Step passed (no screenshot needed)`);
      
      // STEP 5: Log actual behavior with AI correction details if used
      let baseActualBehavior = await this.getActualBehavior(step);
      
      // If AI correction was used, enhance the actual behavior message
      if (correctionDetails.correctionUsed) {
        result.actualBehavior = `✅ Action completed successfully (with AI auto-adaptation)\n\n` +
          `🔧 INTELLIGENT CORRECTION APPLIED:\n` +
          `   • Original selector failed: "${correctionDetails.originalSelector}"\n` +
          `   • AI found correct element: "${correctionDetails.correctedSelector}"\n` +
          `   • Correction source: ${correctionDetails.correctionSource}\n` +
          `   • Attempts: ${correctionDetails.attempts} (1 failed, 1 succeeded)\n` +
          `   • Status: Passed after correction\n\n` +
          `📊 Base behavior: ${baseActualBehavior}`;
        
        // Add correction info to result for UI display
        result.aiCorrection = {
          used: true,
          originalSelector: correctionDetails.originalSelector,
          correctedSelector: correctionDetails.correctedSelector,
          source: correctionDetails.correctionSource,
          attempts: correctionDetails.attempts
        };
        
        console.log(`   🤖 AI Correction: ${correctionDetails.correctionSource}`);
        console.log(`   🔄 ${correctionDetails.originalSelector} → ${correctionDetails.correctedSelector}`);
      } else {
        result.actualBehavior = baseActualBehavior;
        result.aiCorrection = { used: false };
      }
      
      console.log(`   Actual: ${result.actualBehavior.substring(0, 100)}...`);
      
      // STEP 6: Compare expected vs actual
      result.behaviorMatch = this.compareBehavior(
        result.expectedBehavior,
        result.actualBehavior
      );
      
      // STEP 7: If mismatch, log it (but ignore if AI correction was used successfully)
      if (!result.behaviorMatch && !correctionDetails.correctionUsed) {
        console.log(`   ⚠️  Behavior mismatch detected`);
      }
      
      // SUCCESS
      // Store the success screenshot
      result.screenshot = result.screenshotAfter;
      delete result.screenshotAfter;  // Clean up
      
      result.status = 'passed';
      console.log(`   ✅ Step passed`);
      
    } catch (error) {
      // FAILURE
      result.status = 'failed';
      result.error = error.message;
      result.errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack
      };
      
      console.log(`   ❌ Step failed: ${error.message}`);
      
      // Capture failure screenshot
      // WHY: Critical for debugging - see exact state when test failed
      result.screenshot = await this.captureScreenshot('failure');
      console.log(`   📸 Failure screenshot captured`);
      
      // AI-powered failure analysis with live logging
      // WHY: Understand user intent and provide actionable insights
      console.log(`   🤖 Starting AI-powered failure analysis...`);
      result.aiAnalysis = await this.analyzeFailureWithAI(step, error, result);
      console.log(`   ${result.aiAnalysis.understood ? '✅' : '❌'} AI analysis: ${result.aiAnalysis.understanding}`);
      
      // Get actual behavior even on failure
      try {
        result.actualBehavior = await this.getActualBehavior(step);
      } catch {
        result.actualBehavior = 'Unable to capture (page may have crashed)';
      }
      
      result.behaviorMatch = false;
    }
    
    // Finalize timing
    result.endTime = new Date().toISOString();
    result.duration = Date.now() - stepStartTime;
    
    return result;
  }

  /**
   * Get expected behavior description
   * 
   * PURPOSE: Generate human-readable expected behavior
   * WHY: For comparison with actual behavior
   * 
   * @param {Object} step - Test step
   * @returns {string} - Expected behavior description
   */
  getExpectedBehavior(step) {
    const { action, target, data, expected } = step;
    
    switch (action) {
      case 'navigate':
        return `Browser navigates to ${target}`;
      
      case 'click':
        return `Element "${target}" is clicked`;
      
      case 'type':
        return `Text "${data}" is entered in "${target}"`;
      
      case 'verify':
        return expected || `Element "${target}" exists on page`;
      
      case 'wait':
        return `Element "${target}" appears on page`;
      
      default:
        return `Action "${action}" executes successfully`;
    }
  }

  /**
   * Get actual behavior after action execution
   * 
   * PURPOSE: Capture what actually happened
   * CONNECTION: Compared with expected behavior
   * 
   * @param {Object} step - Test step
   * @returns {Promise<string>} - Actual behavior description
   */
  async getActualBehavior(step) {
    const { action, target } = step;
    
    try {
      switch (action) {
        case 'navigate':
          const url = this.page.url();
          return `Browser navigated to ${url}`;
        
        case 'click':
          // Check if element still exists
          const exists = await this.page.locator(target).count() > 0;
          return `Element "${target}" was clicked ${exists ? '(still exists)' : '(no longer visible)'}`;
        
        case 'type':
          // Get current value of field
          const value = await this.page.locator(target).inputValue().catch(() => 'unknown');
          return `Text entered in "${target}", current value: "${value}"`;
        
        case 'verify':
          const isVisible = await this.page.locator(target).isVisible().catch(() => false);
          return `Element "${target}" is ${isVisible ? 'visible' : 'not visible'}`;
        
        case 'wait':
          const appeared = await this.page.locator(target).isVisible().catch(() => false);
          return `Element "${target}" ${appeared ? 'appeared' : 'did not appear'}`;
        
        default:
          return `Action "${action}" completed`;
      }
    } catch (error) {
      return `Unable to verify: ${error.message}`;
    }
  }

  /**
   * Compare expected vs actual behavior
   * 
   * PURPOSE: Determine if step executed as expected
   * WHY: Core of Phase 2 - automated verification
   * 
   * @param {string} expected - Expected behavior
   * @param {string} actual - Actual behavior
   * @returns {boolean} - True if behaviors match
   */
  compareBehavior(expected, actual) {
    // Simple string comparison for now
    // TODO: Implement fuzzy matching in Phase 2.1
    
    // Normalize strings
    const expectedNorm = expected.toLowerCase().trim();
    const actualNorm = actual.toLowerCase().trim();
    
    // Check if actual contains key phrases from expected
    const keyPhrases = expectedNorm.split(' ').filter(word => word.length > 3);
    const matchCount = keyPhrases.filter(phrase => actualNorm.includes(phrase)).length;
    
    // Match if at least 70% of key phrases present
    return matchCount / keyPhrases.length >= 0.7;
  }

  /**
   * Perform the actual browser action with intelligent fallback
   * 
   * CONNECTION: Uses Playwright to interact with browser
   * INTELLIGENCE: If selector fails, use Phase 3 AI to find element
   * WHY: Makes tests intent-based, not selector-based
   * 
   * @param {Object} step - Test step
   * @returns {Promise<Object>} - Correction details if AI was used
   */
  async performAction(step) {
    const { action, target, data, description } = step;
    
    // Navigate doesn't need AI fallback
    if (action === 'navigate') {
      await this.page.goto(target, { waitUntil: 'domcontentloaded', timeout: 30000 });
      return { correctionUsed: false };
    }
    
    // Try original selector first
    try {
      await this.performActionWithSelector(action, target, data);
      return { correctionUsed: false };
    } catch (error) {
      // Selector failed - use INTELLIGENT fallback with RAG caching
      console.log(`   ⚠️  Selector failed: ${error.message.substring(0, 100)}...`);
      
      let correctedSelector = null;
      let correctionSource = null;
      
      // STEP 1: Check RAG for cached correction (fast, free)
      correctedSelector = await this.queryCachedCorrection(target, description);
      if (correctedSelector) {
        correctionSource = 'RAG Cache (Previously Learned)';
      }
      
      // STEP 2: If no cache, use AI (slow, costs money)
      if (!correctedSelector) {
        console.log(`   🤖 No cache found, using AI to find element...`);
        correctedSelector = await this.findElementWithAI(description, action);
        if (correctedSelector) {
          correctionSource = 'AI Web Reader (GPT-4)';
        }
      }
      
      if (correctedSelector) {
        console.log(`   ✅ Using corrected selector: ${correctedSelector}`);
        // Retry with corrected selector
        await this.performActionWithSelector(action, correctedSelector, data);
        
        // Log correction for future learning (if not already cached)
        this.logCorrection(target, correctedSelector, description);
        
        // Return correction details for reporting
        return {
          correctionUsed: true,
          originalSelector: target,
          correctedSelector: correctedSelector,
          correctionSource: correctionSource,
          attempts: 2  // 1 original + 1 corrected
        };
      } else {
        // If both RAG and AI fail, throw original error
        throw error;
      }
    }
  }
  
  /**
   * Perform action with a specific selector
   * 
   * @param {string} action - Action type
   * @param {string} selector - Element selector
   * @param {string} data - Data for type actions
   */
  async performActionWithSelector(action, selector, data) {
    switch (action) {
      case 'click':
        await this.page.locator(selector).click({ timeout: 10000 });
        break;
      
      case 'type':
        await this.page.locator(selector).fill(data, { timeout: 10000 });
        break;
      
      case 'verify':
        await this.page.locator(selector).waitFor({ state: 'visible', timeout: 10000 });
        break;
      
      case 'wait':
        await this.page.locator(selector).waitFor({ state: 'visible', timeout: 10000 });
        break;
      
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  }
  
  /**
   * Query RAG for cached selector corrections - REAL LEARNING!
   * 
   * INTELLIGENCE: Check if we've seen this error before
   * WHY: Reuse past corrections (fast, free) before calling OpenAI (slow, $$$)
   * 
   * @param {string} originalSelector - The selector that failed
   * @param {string} description - Element description
   * @returns {Promise<string|null>} - Cached corrected selector or null
   */
  async queryCachedCorrection(originalSelector, description) {
    try {
      const url = this.page.url();
      
      console.log(`   🔍 Checking RAG for cached correction...`);
      console.log(`   📝 Looking for: originalSelector="${originalSelector}"`);
      
      // Query RAG for similar corrections
      // Use a broad semantic query about selector corrections
      const response = await fetch('http://localhost:3005/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `selector correction: ${originalSelector}`,
          limit: 10  // Get more results to increase match chance
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.results && result.results.length > 0) {
        console.log(`   📊 Found ${result.results.length} potential matches in RAG`);
        
        // STRATEGY 1: Exact selector match (highest priority)
        for (const item of result.results) {
          const meta = item.metadata || {};
          
          if (meta.type === 'selector_correction' && 
              meta.originalSelector === originalSelector) {
            
            console.log(`   ✅ CACHE HIT! Exact selector match found`);
            console.log(`   💾 ${meta.originalSelector} → ${meta.correctedSelector}`);
            console.log(`   ⚡ Saved $0.02 and ~5 seconds!`);
            
            return meta.correctedSelector;
          }
        }
        
        // STRATEGY 2: Same description match (medium priority)
        for (const item of result.results) {
          const meta = item.metadata || {};
          
          if (meta.type === 'selector_correction' &&
              meta.description === description) {
            
            console.log(`   ✅ CACHE HIT! Description match found`);
            console.log(`   💾 ${meta.originalSelector} → ${meta.correctedSelector}`);
            console.log(`   ⚡ Saved $0.02 and ~5 seconds!`);
            
            return meta.correctedSelector;
          }
        }
        
        // Debug: show what we found but didn't match
        console.log(`   🔍 Debug: Checked ${result.results.length} entries, no exact match`);
        for (let i = 0; i < Math.min(3, result.results.length); i++) {
          const meta = result.results[i].metadata || {};
          console.log(`   📄 Entry ${i+1}: type=${meta.type}, selector=${meta.originalSelector}`);
        }
      }
      
      console.log(`   ℹ️  No cached correction found, will use AI (costs $0.02)`);
      return null;
      
    } catch (error) {
      console.log(`   ⚠️  RAG query failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Use Phase 3 AI Web Reader to find element
   * 
   * INTEGRATION: Calls Phase 3 service for intelligent element finding
   * WHY: Makes testing intent-based - describe what you want, AI finds it
   * 
   * @param {string} description - Natural language description
   * @param {string} action - Action to perform
   * @returns {Promise<string|null>} - Corrected selector or null
   */
  async findElementWithAI(description, action) {
    try {
      // Get current page HTML for context
      const url = this.page.url();
      
      // Call Phase 3 AI Web Reader service
      const response = await fetch('http://localhost:3003/api/find-element', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url,
          description: description,
          action: action
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.selector) {
        return result.selector;
      }
      
      return null;
      
    } catch (error) {
      console.log(`   ⚠️  AI element finding failed: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Log selector correction for learning - FIXED FOR REAL LEARNING
   * 
   * CONNECTION: Sends to Phase 4.5 RAG for future learning
   * WHY: System learns from corrections and improves over time
   * INTELLIGENCE: Stores selectors in metadata for fast retrieval
   * 
   * @param {string} originalSelector - Original failed selector
   * @param {string} correctedSelector - AI-corrected selector
   * @param {string} description - Element description
   */
  async logCorrection(originalSelector, correctedSelector, description) {
    try {
      const url = this.page.url();
      
      // Store correction in knowledge base for learning
      // KEY FIX: Store selectors in metadata (searchable) not nested in steps
      await fetch('http://localhost:3005/api/rag/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: `correction_${Date.now()}`,
          testName: `Correction: ${description}`,
          url: url,
          steps: [{
            description: description,
            action: 'correction'
          }],
          results: {
            passed: 1,
            failed: 0,
            total: 1,
            duration: 0
          },
          metadata: {
            // CRITICAL: Store in metadata for easy querying
            timestamp: new Date().toISOString(),
            type: 'selector_correction',
            browser: 'chromium',
            originalSelector: originalSelector,      // ✅ Now searchable!
            correctedSelector: correctedSelector,    // ✅ Now searchable!
            description: description,                // ✅ Now searchable!
            url: url,                                // ✅ Now searchable!
            correctedBy: 'AI Web Reader'
          }
        })
      });
      
      console.log(`   📚 Correction logged for future learning (searchable format)`);
      
    } catch (error) {
      // Non-critical, just log
      console.log(`   ⚠️  Failed to log correction: ${error.message}`);
    }
  }

  /**
   * Capture screenshot
   * 
   * @param {string} type - Screenshot type (before, after, failure)
   * @returns {Promise<string>} - Screenshot file path
   */
  async captureScreenshot(type) {
    try {
      const screenshotDir = path.join(
        this.artifactsDir,
        this.currentTestId,
        'screenshots'
      );
      
      await fs.mkdir(screenshotDir, { recursive: true });
      
      const filename = `step_${this.currentStepNumber}_${type}_${Date.now()}.png`;
      const filepath = path.join(screenshotDir, filename);
      
      await this.page.screenshot({
        path: filepath,
        fullPage: true
      });
      
      return filepath;
      
    } catch (error) {
      console.error(`   ⚠️  Screenshot capture failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Setup browser with advanced logging
   * 
   * PURPOSE: Capture all network activity and console output
   * WHY: Network errors and console errors can break pages
   */
  async setupBrowser(options = {}) {
    console.log('🌐 Launching browser...');
    
    this.browser = await chromium.launch({
      headless: options.headless || false
    });
    
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    this.page = await this.context.newPage();
    
    // ADVANCED LOGGING: Console messages
    // WHY: JavaScript errors can break page functionality
    this.page.on('console', msg => {
      const currentStep = this.stepResults[this.stepResults.length - 1];
      if (!currentStep) return;
      
      const logEntry = {
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      };
      
      if (msg.type() === 'error') {
        currentStep.consoleErrors.push(logEntry);
        console.log(`   🔴 Console Error: ${msg.text()}`);
      } else if (msg.type() === 'warning') {
        currentStep.consoleWarnings.push(logEntry);
        console.log(`   🟡 Console Warning: ${msg.text()}`);
      }
    });
    
    // ADVANCED LOGGING: Network requests
    // WHY: Track all HTTP requests for debugging
    this.page.on('request', request => {
      const currentStep = this.stepResults[this.stepResults.length - 1];
      if (!currentStep) return;
      
      currentStep.networkRequests.push({
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType(),
        timestamp: new Date().toISOString()
      });
    });
    
    // ADVANCED LOGGING: Network responses
    // WHY: Failed requests (4xx, 5xx) can break functionality
    this.page.on('response', response => {
      const currentStep = this.stepResults[this.stepResults.length - 1];
      if (!currentStep) return;
      
      const status = response.status();
      
      // Track failed requests
      if (status >= 400) {
        const errorEntry = {
          url: response.url(),
          status: status,
          statusText: response.statusText(),
          method: response.request().method(),
          timestamp: new Date().toISOString()
        };
        
        currentStep.networkErrors.push(errorEntry);
        console.log(`   🔴 Network Error: ${status} ${response.url()}`);
      }
    });
    
    // ADVANCED LOGGING: Request failures
    // WHY: Timeouts and network failures can break pages
    this.page.on('requestfailed', request => {
      const currentStep = this.stepResults[this.stepResults.length - 1];
      if (!currentStep) return;
      
      const errorEntry = {
        url: request.url(),
        error: request.failure()?.errorText || 'Request failed',
        method: request.method(),
        timestamp: new Date().toISOString()
      };
      
      currentStep.networkErrors.push(errorEntry);
      console.log(`   🔴 Request Failed: ${request.url()} - ${errorEntry.error}`);
    });
    
    // ADVANCED LOGGING: Page errors (crashes)
    // WHY: Page crashes are critical failures
    this.page.on('pageerror', error => {
      const currentStep = this.stepResults[this.stepResults.length - 1];
      if (!currentStep) return;
      
      const errorEntry = {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      };
      
      currentStep.pageErrors.push(errorEntry);
      console.log(`   🔴 Page Error: ${error.message}`);
    });
    
    console.log('   ✓ Browser ready with advanced logging');
  }

  /**
   * Teardown browser
   */
  async teardownBrowser() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Browser closed');
    }
  }

  /**
   * Generate final test report
   * 
   * PURPOSE: Summarize all step results
   * OUTPUT: Used by UI to display test results
   * 
   * @returns {Promise<Object>} - Complete test report
   */
  async generateReport() {
    const passedSteps = this.stepResults.filter(r => r.status === 'passed').length;
    const failedSteps = this.stepResults.filter(r => r.status === 'failed').length;
    
    const report = {
      success: failedSteps === 0,
      testId: this.currentTestId,
      totalSteps: this.stepResults.length,
      passedSteps,
      failedSteps,
      duration: Date.now() - this.testStartTime,
      timestamp: new Date().toISOString(),
      steps: this.stepResults
    };
    
    // Save report to disk
    const reportPath = path.join(this.artifactsDir, this.currentTestId, 'report.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n💾 Report saved: ${reportPath}`);
    
    return report;
  }
  
  /**
   * AI-Powered Failure Analysis with Live Logging
   * 
   * PURPOSE: Understand user intent and provide intelligent feedback on failures
   * 
   * PROCESS:
   * 1. Analyze the failed step and error
   * 2. Query RAG for similar past failures
   * 3. Use GPT-4 to understand user intent
   * 4. Provide actionable insights
   * 5. If unable to understand, clearly state that
   * 
   * @param {Object} step - The failed test step
   * @param {Error} error - The error that occurred
   * @param {Object} result - The step result object
   * @returns {Promise<Object>} - AI analysis result
   */
  async analyzeFailureWithAI(step, error, result) {
    const analysis = {
      understood: false,
      understanding: '',
      userIntent: '',
      possibleIssues: [],
      suggestedFixes: [],
      confidence: 0,
      learnings: [],
      liveLog: []
    };
    
    try {
      // Step 1: Log start of analysis
      analysis.liveLog.push('🔍 Analyzing failure...');
      console.log(`      💭 Analyzing what user wanted to achieve...`);
      
      // Step 2: Extract user intent from step description
      analysis.liveLog.push(`📋 User wanted to: "${step.description || step.action}"`);
      console.log(`      📋 User intent: "${step.description || step.action}"`);
      
      // Step 3: Query RAG for similar failures
      analysis.liveLog.push('🔎 Checking knowledge base for similar failures...');
      console.log(`      🔎 Querying RAG for past similar failures...`);
      
      const ragResults = await this.queryRAGForSimilarFailures(step, error);
      
      if (ragResults && ragResults.length > 0) {
        analysis.liveLog.push(`📚 Found ${ragResults.length} similar case(s) in history`);
        console.log(`      📚 Found ${ragResults.length} similar failures in knowledge base`);
        
        // Extract learnings from past failures
        for (const pastCase of ragResults) {
          if (pastCase.metadata && pastCase.metadata.resolution) {
            analysis.learnings.push(pastCase.metadata.resolution);
            console.log(`      💡 Past solution: ${pastCase.metadata.resolution}`);
          }
        }
      } else {
        analysis.liveLog.push('📚 No similar cases found in history');
        console.log(`      📚 No similar failures found in knowledge base`);
      }
      
      // Step 4: Use GPT-4 to understand intent and provide insights
      analysis.liveLog.push('🤖 AI analyzing user intent and context...');
      console.log(`      🤖 Calling GPT-4 for intelligent analysis...`);
      
      const aiInsights = await this.getAIInsights(step, error, result, ragResults);
      
      if (aiInsights.success) {
        analysis.understood = aiInsights.understood;
        analysis.userIntent = aiInsights.userIntent;
        analysis.possibleIssues = aiInsights.possibleIssues;
        analysis.suggestedFixes = aiInsights.suggestedFixes;
        analysis.confidence = aiInsights.confidence;
        
        if (analysis.understood) {
          analysis.understanding = `Understood: ${analysis.userIntent}`;
          analysis.liveLog.push(`✅ AI understood user intent (${analysis.confidence}% confident)`);
          console.log(`      ✅ AI understood: ${analysis.userIntent}`);
          console.log(`      💡 Confidence: ${analysis.confidence}%`);
          
          // Log possible issues
          if (analysis.possibleIssues.length > 0) {
            analysis.liveLog.push(`⚠️  Identified ${analysis.possibleIssues.length} possible issue(s)`);
            console.log(`      ⚠️  Possible issues:`);
            analysis.possibleIssues.forEach((issue, i) => {
              console.log(`         ${i + 1}. ${issue}`);
            });
          }
          
          // Log suggested fixes
          if (analysis.suggestedFixes.length > 0) {
            analysis.liveLog.push(`🔧 Generated ${analysis.suggestedFixes.length} suggested fix(es)`);
            console.log(`      🔧 Suggested fixes:`);
            analysis.suggestedFixes.forEach((fix, i) => {
              console.log(`         ${i + 1}. ${fix}`);
            });
          }
        } else {
          analysis.understanding = `❌ AI could not understand what you were trying to do. Error: ${error.message}`;
          analysis.liveLog.push('❌ Unable to understand user intent from available context');
          console.log(`      ❌ AI unable to determine user intent`);
          console.log(`      💬 Suggestion: Please provide more specific description or use clearer selectors`);
        }
      } else {
        // AI call failed
        analysis.understood = false;
        analysis.understanding = `❌ AI analysis failed: ${aiInsights.error}`;
        analysis.liveLog.push(`❌ AI analysis encountered an error`);
        console.log(`      ❌ AI analysis failed: ${aiInsights.error}`);
      }
      
      // Step 5: Store analysis in RAG for future learning
      if (analysis.understood) {
        analysis.liveLog.push('💾 Storing analysis in knowledge base for future learning...');
        console.log(`      💾 Storing failure analysis in RAG...`);
        await this.storeFailureAnalysisInRAG(step, error, analysis);
      }
      
      // Final summary
      analysis.liveLog.push(`🏁 Analysis complete`);
      console.log(`      🏁 AI failure analysis complete`);
      
    } catch (analysisError) {
      console.error(`      ⚠️  Error during AI analysis: ${analysisError.message}`);
      analysis.understood = false;
      analysis.understanding = `❌ Failed to analyze: ${analysisError.message}`;
      analysis.liveLog.push(`❌ Analysis error: ${analysisError.message}`);
    }
    
    return analysis;
  }
  
  /**
   * Query RAG for similar past failures
   */
  async queryRAGForSimilarFailures(step, error) {
    try {
      const query = `Failed step: ${step.action} on "${step.target}" - Error: ${error.message}`;
      
      const response = await fetch('http://localhost:3005/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query,
          topK: 3
        })
      });
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.success ? data.results : [];
    } catch (error) {
      console.log(`      ⚠️  RAG query failed: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Get AI insights using GPT-4
   */
  async getAIInsights(step, error, result, ragResults) {
    try {
      // Check if OpenAI key is available
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        return {
          success: false,
          error: 'OpenAI API key not configured',
          understood: false
        };
      }
      
      // Prepare context for GPT-4
      const context = {
        step: {
          action: step.action,
          target: step.target,
          description: step.description,
          data: step.data
        },
        error: {
          message: error.message,
          name: error.name
        },
        pageContext: {
          url: result.pageUrl,
          title: result.pageTitle
        },
        pastSimilarCases: ragResults.length
      };
      
      // Create a structured prompt for GPT-4
      const prompt = `You are an AI test automation expert analyzing a test failure.

**Test Step That Failed:**
- Action: ${step.action}
- Target: ${step.target}
- Description: ${step.description || 'No description provided'}
- Data: ${step.data || 'N/A'}

**Error:**
- Message: ${error.message}
- Type: ${error.name}

**Page Context:**
- URL: ${result.pageUrl}
- Title: ${result.pageTitle}

**Past Similar Failures:** ${ragResults.length} found in knowledge base

**Your Task:**
1. Understand what the user was ACTUALLY trying to achieve
2. Identify why it failed (possible root causes)
3. Suggest specific fixes
4. Rate your confidence (0-100%)

**If you cannot understand the user's intent or the failure is too ambiguous, clearly state "CANNOT_UNDERSTAND" and explain why.**

Respond in JSON format:
{
  "understood": true/false,
  "userIntent": "clear description of what user wanted",
  "possibleIssues": ["issue 1", "issue 2"],
  "suggestedFixes": ["fix 1", "fix 2"],
  "confidence": 85,
  "reasoning": "explanation of analysis"
}`;
      
      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You are an expert test automation analyst. Analyze test failures and provide actionable insights.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error?.message || 'OpenAI API call failed',
          understood: false
        };
      }
      
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Parse AI response
      try {
        const parsed = JSON.parse(aiResponse);
        return {
          success: true,
          ...parsed
        };
      } catch (parseError) {
        // If JSON parsing fails, try to extract insights from text
        return {
          success: true,
          understood: !aiResponse.includes('CANNOT_UNDERSTAND'),
          userIntent: aiResponse.includes('CANNOT_UNDERSTAND') 
            ? 'Unable to determine user intent' 
            : 'Analysis available in raw format',
          possibleIssues: ['AI response format error'],
          suggestedFixes: ['Review AI response manually'],
          confidence: 30,
          reasoning: aiResponse
        };
      }
      
    } catch (error) {
      console.error(`      ⚠️  AI insights call failed: ${error.message}`);
      return {
        success: false,
        error: error.message,
        understood: false
      };
    }
  }
  
  /**
   * Store failure analysis in RAG for future learning
   */
  async storeFailureAnalysisInRAG(step, error, analysis) {
    try {
      const failureData = {
        testId: `failure_${Date.now()}`,
        testName: `Failure Analysis: ${step.action} on ${step.target}`,
        url: this.page?.url() || 'unknown',
        steps: [step],
        results: {
          passed: 0,
          failed: 1,
          total: 1
        },
        metadata: {
          timestamp: new Date().toISOString(),
          stepAction: step.action,
          stepTarget: step.target,
          stepDescription: step.description,
          errorMessage: error.message,
          userIntent: analysis.userIntent,
          possibleIssues: analysis.possibleIssues.join('; '),
          suggestedFixes: analysis.suggestedFixes.join('; '),
          confidence: analysis.confidence,
          understood: analysis.understood
        }
      };
      
      await fetch('http://localhost:3005/api/rag/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(failureData)
      });
      
      console.log(`      ✅ Failure analysis stored in RAG`);
    } catch (error) {
      console.log(`      ⚠️  Failed to store in RAG: ${error.message}`);
    }
  }
  
  /**
   * Execute assertions after test steps
   * 
   * @param {Array} assertions - Array of assertion objects
   * @returns {Promise<Object>} - Assertion results
   */
  async executeAssertions(assertions) {
    if (!assertions || assertions.length === 0) {
      return { passed: [], failed: [], total: 0 };
    }
    
    console.log(`\n🎯 Executing ${assertions.length} assertion(s)...`);
    
    const passed = [];
    const failed = [];
    
    for (const assertion of assertions) {
      try {
        const result = await this.executeSingleAssertion(assertion);
        
        if (result.passed) {
          passed.push(result);
          console.log(`   ✅ ${assertion.type}: ${assertion.description || assertion.target}`);
        } else {
          failed.push(result);
          console.log(`   ❌ ${assertion.type}: ${result.error}`);
        }
      } catch (error) {
        failed.push({
          assertion,
          passed: false,
          error: error.message,
          actualValue: null
        });
        console.log(`   ❌ ${assertion.type}: ${error.message}`);
      }
    }
    
    return {
      passed,
      failed,
      total: assertions.length,
      passRate: Math.round((passed.length / assertions.length) * 100)
    };
  }
  
  /**
   * Execute a single assertion
   * 
   * @param {Object} assertion - Assertion object
   * @returns {Promise<Object>} - Assertion result
   */
  async executeSingleAssertion(assertion) {
    const { type, target, expected, description } = assertion;
    
    try {
      switch (type) {
        case 'element_visible': {
          const isVisible = await this.page.isVisible(target);
          return {
            assertion,
            passed: isVisible,
            actualValue: isVisible,
            expectedValue: true,
            error: isVisible ? null : `Element "${target}" is not visible`
          };
        }
        
        case 'element_hidden': {
          const isVisible = await this.page.isVisible(target).catch(() => false);
          return {
            assertion,
            passed: !isVisible,
            actualValue: isVisible,
            expectedValue: false,
            error: isVisible ? `Element "${target}" is visible but should be hidden` : null
          };
        }
        
        case 'text_equals': {
          const actualText = await this.page.textContent(target);
          const matches = actualText?.trim() === expected?.trim();
          return {
            assertion,
            passed: matches,
            actualValue: actualText,
            expectedValue: expected,
            error: matches ? null : `Expected "${expected}" but got "${actualText}"`
          };
        }
        
        case 'text_contains': {
          const actualText = await this.page.textContent(target);
          const contains = actualText?.includes(expected);
          return {
            assertion,
            passed: contains,
            actualValue: actualText,
            expectedValue: `contains "${expected}"`,
            error: contains ? null : `Text "${actualText}" does not contain "${expected}"`
          };
        }
        
        case 'url_equals': {
          const actualUrl = this.page.url();
          const matches = actualUrl === target;
          return {
            assertion,
            passed: matches,
            actualValue: actualUrl,
            expectedValue: target,
            error: matches ? null : `Expected URL "${target}" but got "${actualUrl}"`
          };
        }
        
        case 'url_contains': {
          const actualUrl = this.page.url();
          const contains = actualUrl.includes(target);
          return {
            assertion,
            passed: contains,
            actualValue: actualUrl,
            expectedValue: `contains "${target}"`,
            error: contains ? null : `URL "${actualUrl}" does not contain "${target}"`
          };
        }
        
        case 'element_count': {
          const count = await this.page.locator(target).count();
          const expectedCount = parseInt(expected);
          const matches = count === expectedCount;
          return {
            assertion,
            passed: matches,
            actualValue: count,
            expectedValue: expectedCount,
            error: matches ? null : `Expected ${expectedCount} element(s) but found ${count}`
          };
        }
        
        case 'attribute_equals': {
          const [selector, attribute] = target.split('::');
          const actualValue = await this.page.getAttribute(selector, attribute);
          const matches = actualValue === expected;
          return {
            assertion,
            passed: matches,
            actualValue,
            expectedValue: expected,
            error: matches ? null : `Attribute "${attribute}" has value "${actualValue}" but expected "${expected}"`
          };
        }
        
        default:
          throw new Error(`Unknown assertion type: ${type}`);
      }
    } catch (error) {
      return {
        assertion,
        passed: false,
        actualValue: null,
        expectedValue: expected,
        error: `Assertion execution failed: ${error.message}`
      };
    }
  }
}

/**
 * Export executor
 * CONNECTION: Used by server.js to handle test execution requests
 */
export default TestExecutor;

