/**
 * Test Planner - Converts parsed intent into executable test plan
 * 
 * Takes structured steps from Intent Parser and adds metadata, IDs,
 * retry logic, and expected outcomes to create a complete test plan.
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ensureDirectoryExists } from '../utils/helpers.js';

class TestPlanner {
  constructor(config) {
    this.config = config;
    this.plansDir = path.join(process.cwd(), config.paths.plans);
  }

  /**
   * Generate executable test plan from parsed intent
   * @param {Object} parsedIntent - Output from IntentParser
   * @returns {Promise<Object>} Complete test plan with metadata
   */
  async generateTestPlan(parsedIntent) {
    console.log('📋 Generating executable test plan...');
    
    try {
      const testPlan = {
        id: uuidv4(),
        name: this.generateTestName(parsedIntent.intent),
        intent: parsedIntent.intent,
        createdAt: new Date().toISOString(),
        status: 'pending',
        config: {
          browser: this.config.executor.browser,
          timeout: this.config.executor.timeout,
          retries: this.config.executor.retries,
          screenshotOnFailure: this.config.executor.screenshotOnFailure,
          videoOnFailure: this.config.executor.videoOnFailure
        },
        steps: this.enrichSteps(parsedIntent.steps),
        metadata: {
          totalSteps: parsedIntent.steps.length,
          estimatedDuration: this.estimateDuration(parsedIntent.steps),
          parsedBy: parsedIntent.metadata
        }
      };
      
      // Save test plan to disk
      await this.saveTestPlan(testPlan);
      
      console.log(`✅ Test plan generated: ${testPlan.id}`);
      console.log(`   Name: ${testPlan.name}`);
      console.log(`   Steps: ${testPlan.steps.length}`);
      console.log(`   Estimated duration: ${testPlan.metadata.estimatedDuration}s`);
      
      return testPlan;
      
    } catch (error) {
      console.error('❌ Error generating test plan:', error.message);
      throw error;
    }
  }

  /**
   * Enrich parsed steps with execution metadata
   * @param {Array} steps - Parsed steps from IntentParser
   * @returns {Array} Enriched steps with IDs and metadata
   */
  enrichSteps(steps) {
    return steps.map((step, index) => ({
      id: `step_${index + 1}_${uuidv4().substring(0, 8)}`,
      stepNumber: step.stepNumber || index + 1,
      description: step.description,
      action: step.action,
      target: step.target,
      data: step.data,
      assertion: step.assertion,
      timeout: this.getTimeoutForAction(step.action),
      retries: this.getRetriesForAction(step.action),
      optional: step.optional || false,
      status: 'pending',
      screenshots: [],
      logs: [],
      timing: {
        started: null,
        completed: null,
        duration: null
      }
    }));
  }

  /**
   * Generate a clean test name from intent
   * @param {string} intent - Original intent text
   * @returns {string} Clean test name
   */
  generateTestName(intent) {
    // Take first sentence or first 50 chars
    let name = intent.split(/[.\n]/)[0].trim();
    if (name.length > 50) {
      name = name.substring(0, 47) + '...';
    }
    return name;
  }

  /**
   * Get timeout for specific action type
   * @param {string} action - Action type
   * @returns {number} Timeout in milliseconds
   */
  getTimeoutForAction(action) {
    const timeouts = {
      navigate: 30000,
      wait: 10000,
      click: 5000,
      type: 5000,
      verify: 10000,
      default: this.config.executor.timeout
    };
    
    return timeouts[action] || timeouts.default;
  }

  /**
   * Get retry count for specific action type
   * @param {string} action - Action type
   * @returns {number} Number of retries
   */
  getRetriesForAction(action) {
    // Verification steps might need more retries
    if (action === 'verify' || action === 'wait') {
      return this.config.executor.retries + 1;
    }
    return this.config.executor.retries;
  }

  /**
   * Estimate total test duration
   * @param {Array} steps - Test steps
   * @returns {number} Estimated seconds
   */
  estimateDuration(steps) {
    const baseDurations = {
      navigate: 3,
      wait: 2,
      click: 1,
      type: 2,
      verify: 2,
      default: 2
    };
    
    let total = 0;
    steps.forEach(step => {
      total += baseDurations[step.action] || baseDurations.default;
    });
    
    return Math.ceil(total);
  }

  /**
   * Save test plan to disk
   * @param {Object} testPlan - Complete test plan
   */
  async saveTestPlan(testPlan) {
    try {
      await ensureDirectoryExists(this.plansDir);
      
      const filename = `testplan_${testPlan.id}.json`;
      const filepath = path.join(this.plansDir, filename);
      
      await fs.writeFile(filepath, JSON.stringify(testPlan, null, 2));
      console.log(`💾 Test plan saved: ${filepath}`);
      
    } catch (error) {
      console.error('❌ Failed to save test plan:', error.message);
      throw error;
    }
  }

  /**
   * Load test plan from disk
   * @param {string} planId - Test plan ID
   * @returns {Promise<Object>} Test plan
   */
  async loadTestPlan(planId) {
    try {
      const filename = `testplan_${planId}.json`;
      const filepath = path.join(this.plansDir, filename);
      
      const content = await fs.readFile(filepath, 'utf8');
      return JSON.parse(content);
      
    } catch (error) {
      console.error(`❌ Failed to load test plan ${planId}:`, error.message);
      throw error;
    }
  }

  /**
   * List all test plans
   * @returns {Promise<Array>} Array of test plan summaries
   */
  async listTestPlans() {
    try {
      await ensureDirectoryExists(this.plansDir);
      const files = await fs.readdir(this.plansDir);
      
      const plans = [];
      for (const file of files) {
        if (file.startsWith('testplan_') && file.endsWith('.json')) {
          const filepath = path.join(this.plansDir, file);
          const content = await fs.readFile(filepath, 'utf8');
          const plan = JSON.parse(content);
          
          plans.push({
            id: plan.id,
            name: plan.name,
            status: plan.status,
            createdAt: plan.createdAt,
            totalSteps: plan.metadata.totalSteps
          });
        }
      }
      
      return plans.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
    } catch (error) {
      console.error('❌ Failed to list test plans:', error.message);
      return [];
    }
  }

  /**
   * Explain how the planner works
   */
  explain() {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    TEST PLANNER EXPLANATION                    ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Purpose: Convert parsed steps → executable test plan         ║
║                                                                ║
║  Enrichment Process:                                          ║
║  1. Assign unique IDs to test and each step                   ║
║  2. Add timeouts based on action type                         ║
║  3. Configure retry logic                                     ║
║  4. Set up screenshot/video capture settings                  ║
║  5. Estimate test duration                                    ║
║  6. Save as structured JSON file                              ║
║                                                                ║
║  Test Plan Structure:                                         ║
║  - Test ID and name                                           ║
║  - Original intent                                            ║
║  - Configuration (browser, timeouts, retries)                 ║
║  - Enriched steps with metadata                               ║
║  - Execution tracking (status, timing, logs)                  ║
║                                                                ║
║  Storage:                                                     ║
║  - Saved to ./plans/ directory                                ║
║  - One JSON file per test plan                                ║
║  - Can be loaded and re-executed later                        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);
  }
}

export default TestPlanner;

