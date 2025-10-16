/**
 * Automated Test Trigger System
 * 
 * @author Purushothama Raju
 * @date 12/10/2025
 * @copyright Copyright © 2025 Purushothama Raju
 * 
 * PURPOSE:
 * Allow users to configure ANY test suite to run automatically on specific triggers.
 * Provides complete flexibility for automation.
 * 
 * FEATURES:
 * - Trigger any test suite on code push
 * - Multiple triggers per suite (branch-specific, time-based, manual)
 * - Customizable trigger conditions
 * - Execution history and logs
 * - Success/failure notifications
 * 
 * TRIGGER TYPES:
 * - Code push to specific branches
 * - Scheduled (cron-like)
 * - Manual webhook
 * - On-demand API call
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class AutomatedTestTrigger {
  constructor() {
    this.triggersPath = './config/triggers';
    this.executionHistoryPath = './config/execution-history';
  }

  /**
   * Initialize trigger system
   */
  async initialize() {
    await fs.mkdir(this.triggersPath, { recursive: true });
    await fs.mkdir(this.executionHistoryPath, { recursive: true });
    console.log('🎯 Automated Test Trigger System initialized');
  }

  /**
   * Create a new trigger configuration
   * 
   * @param {Object} config - Trigger configuration
   * @returns {Object} Created trigger
   */
  async createTrigger(config) {
    console.log(`🔧 Creating trigger: ${config.name}`);

    const trigger = {
      id: `trigger_${Date.now()}_${uuidv4().substring(0, 8)}`,
      name: config.name,
      description: config.description || '',
      enabled: config.enabled !== false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      // What to run
      testSuiteIds: config.testSuiteIds || [],
      
      // When to run
      triggerType: config.triggerType, // 'push', 'schedule', 'webhook', 'manual'
      
      // Trigger conditions
      conditions: {
        // For 'push' type
        cloudProvider: config.conditions?.cloudProvider || null, // 'github', 'gitlab', 'azure', 'aws'
        repository: config.conditions?.repository || null,
        branches: config.conditions?.branches || ['main', 'master'], // ['main', 'develop', 'feature/*']
        
        // For 'schedule' type
        schedule: config.conditions?.schedule || null, // Cron expression: '0 0 * * *'
        timezone: config.conditions?.timezone || 'UTC',
        
        // For 'webhook' type
        webhookSecret: config.conditions?.webhookSecret || null,
        
        // Additional filters
        filePatterns: config.conditions?.filePatterns || [], // ['src/**/*.js', 'tests/**']
        skipPatterns: config.conditions?.skipPatterns || [], // ['docs/**', '*.md']
        commitMessagePattern: config.conditions?.commitMessagePattern || null // RegEx
      },
      
      // Execution settings
      execution: {
        parallel: config.execution?.parallel || false,
        maxConcurrent: config.execution?.maxConcurrent || 1,
        timeout: config.execution?.timeout || 3600000, // 1 hour default
        retryOnFailure: config.execution?.retryOnFailure || false,
        maxRetries: config.execution?.maxRetries || 0
      },
      
      // Notifications
      notifications: {
        onSuccess: config.notifications?.onSuccess || false,
        onFailure: config.notifications?.onFailure || true,
        email: config.notifications?.email || [],
        slack: config.notifications?.slack || null,
        webhook: config.notifications?.webhook || null
      },
      
      // Statistics
      stats: {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        lastRun: null,
        lastRunStatus: null
      }
    };

    // Validate trigger
    this.validateTrigger(trigger);

    // Save trigger
    const filePath = path.join(this.triggersPath, `${trigger.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(trigger, null, 2));

    console.log(`   ✅ Trigger created: ${trigger.id}`);

    return trigger;
  }

  /**
   * Validate trigger configuration
   */
  validateTrigger(trigger) {
    const validTypes = ['push', 'schedule', 'webhook', 'manual'];
    
    if (!validTypes.includes(trigger.triggerType)) {
      throw new Error(`Invalid trigger type: ${trigger.triggerType}. Must be one of: ${validTypes.join(', ')}`);
    }

    if (!trigger.testSuiteIds || trigger.testSuiteIds.length === 0) {
      throw new Error('At least one test suite must be specified');
    }

    if (trigger.triggerType === 'push' && !trigger.conditions.cloudProvider) {
      throw new Error('Cloud provider must be specified for push triggers');
    }

    if (trigger.triggerType === 'schedule' && !trigger.conditions.schedule) {
      throw new Error('Schedule (cron expression) must be specified for scheduled triggers');
    }
  }

  /**
   * Evaluate if trigger should fire based on event
   */
  async shouldTrigger(trigger, event) {
    if (!trigger.enabled) {
      return { shouldTrigger: false, reason: 'Trigger is disabled' };
    }

    // Check trigger type matches event
    if (trigger.triggerType === 'push' && event.type === 'push') {
      return this.evaluatePushTrigger(trigger, event);
    } else if (trigger.triggerType === 'schedule' && event.type === 'schedule') {
      return { shouldTrigger: true, reason: 'Scheduled execution' };
    } else if (trigger.triggerType === 'webhook' && event.type === 'webhook') {
      return this.evaluateWebhookTrigger(trigger, event);
    } else if (trigger.triggerType === 'manual' && event.type === 'manual') {
      return { shouldTrigger: true, reason: 'Manual trigger' };
    }

    return { shouldTrigger: false, reason: 'Trigger type does not match event' };
  }

  /**
   * Evaluate push trigger conditions
   */
  evaluatePushTrigger(trigger, event) {
    const conditions = trigger.conditions;
    
    // Check provider
    if (conditions.cloudProvider && conditions.cloudProvider !== event.provider) {
      return { shouldTrigger: false, reason: `Provider mismatch (expected ${conditions.cloudProvider})` };
    }

    // Check repository
    if (conditions.repository && conditions.repository !== event.repository) {
      return { shouldTrigger: false, reason: 'Repository does not match' };
    }

    // Check branch
    if (conditions.branches && conditions.branches.length > 0) {
      const branchMatch = conditions.branches.some(pattern => {
        if (pattern.includes('*')) {
          const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
          return regex.test(event.branch);
        }
        return pattern === event.branch;
      });

      if (!branchMatch) {
        return { shouldTrigger: false, reason: `Branch '${event.branch}' does not match filters` };
      }
    }

    // Check file patterns (if provided in event)
    if (conditions.filePatterns && conditions.filePatterns.length > 0 && event.files) {
      const fileMatch = event.files.some(file => 
        conditions.filePatterns.some(pattern => this.matchPattern(file, pattern))
      );

      if (!fileMatch) {
        return { shouldTrigger: false, reason: 'No matching file patterns' };
      }
    }

    // Check skip patterns
    if (conditions.skipPatterns && conditions.skipPatterns.length > 0 && event.files) {
      const shouldSkip = event.files.every(file =>
        conditions.skipPatterns.some(pattern => this.matchPattern(file, pattern))
      );

      if (shouldSkip) {
        return { shouldTrigger: false, reason: 'All files match skip patterns' };
      }
    }

    // Check commit message pattern
    if (conditions.commitMessagePattern && event.message) {
      const regex = new RegExp(conditions.commitMessagePattern);
      if (!regex.test(event.message)) {
        return { shouldTrigger: false, reason: 'Commit message does not match pattern' };
      }
    }

    return { 
      shouldTrigger: true, 
      reason: `Push to ${event.branch} in ${event.repository}` 
    };
  }

  /**
   * Evaluate webhook trigger
   */
  evaluateWebhookTrigger(trigger, event) {
    // Validate webhook secret if configured
    if (trigger.conditions.webhookSecret) {
      if (event.secret !== trigger.conditions.webhookSecret) {
        return { shouldTrigger: false, reason: 'Invalid webhook secret' };
      }
    }

    return { shouldTrigger: true, reason: 'Webhook triggered' };
  }

  /**
   * Execute trigger (run test suites)
   */
  async executeTrigger(trigger, event) {
    console.log(`\n🚀 Executing trigger: ${trigger.name}`);
    console.log(`   Test Suites: ${trigger.testSuiteIds.join(', ')}`);
    console.log(`   Reason: ${event.reason || 'Manual trigger'}`);

    const executionId = `exec_${Date.now()}_${uuidv4().substring(0, 8)}`;
    
    const execution = {
      id: executionId,
      triggerId: trigger.id,
      triggerName: trigger.name,
      testSuiteIds: trigger.testSuiteIds,
      event: event,
      startTime: new Date().toISOString(),
      endTime: null,
      status: 'running',
      results: [],
      errors: []
    };

    try {
      // Execute each test suite
      for (const suiteId of trigger.testSuiteIds) {
        console.log(`   📋 Running test suite: ${suiteId}`);
        
        const suiteResult = await this.executeTestSuite(suiteId, trigger.execution);
        execution.results.push(suiteResult);
        
        console.log(`      ${suiteResult.status === 'passed' ? '✅' : '❌'} ${suiteResult.status.toUpperCase()}`);
      }

      // Determine overall status
      const hasFailures = execution.results.some(r => r.status === 'failed');
      execution.status = hasFailures ? 'failed' : 'passed';
      execution.endTime = new Date().toISOString();

      // Update trigger stats
      await this.updateTriggerStats(trigger.id, execution.status);

      // Save execution history
      await this.saveExecutionHistory(execution);

      // Send notifications
      await this.sendNotifications(trigger, execution);

      console.log(`\n✅ Trigger execution complete: ${execution.status.toUpperCase()}`);

      return execution;

    } catch (error) {
      execution.status = 'error';
      execution.endTime = new Date().toISOString();
      execution.errors.push(error.message);

      await this.updateTriggerStats(trigger.id, 'failed');
      await this.saveExecutionHistory(execution);

      console.error(`❌ Trigger execution failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute a single test suite
   * (This would call the actual test execution engine)
   */
  async executeTestSuite(suiteId, executionSettings) {
    // In production, this would call the Phase 2 test executor
    // For now, return a mock result
    
    return {
      suiteId: suiteId,
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      status: 'passed', // or 'failed'
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      duration: 0
    };
  }

  /**
   * Update trigger statistics
   */
  async updateTriggerStats(triggerId, status) {
    const trigger = await this.getTrigger(triggerId);
    
    trigger.stats.totalRuns++;
    trigger.stats.lastRun = new Date().toISOString();
    trigger.stats.lastRunStatus = status;
    
    if (status === 'passed') {
      trigger.stats.successfulRuns++;
    } else {
      trigger.stats.failedRuns++;
    }

    trigger.updatedAt = new Date().toISOString();

    const filePath = path.join(this.triggersPath, `${triggerId}.json`);
    await fs.writeFile(filePath, JSON.stringify(trigger, null, 2));
  }

  /**
   * Save execution history
   */
  async saveExecutionHistory(execution) {
    const filePath = path.join(this.executionHistoryPath, `${execution.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(execution, null, 2));
  }

  /**
   * Send notifications
   */
  async sendNotifications(trigger, execution) {
    const notifications = trigger.notifications;
    
    const shouldNotify = 
      (execution.status === 'passed' && notifications.onSuccess) ||
      (execution.status !== 'passed' && notifications.onFailure);

    if (!shouldNotify) {
      return;
    }

    console.log(`   📧 Sending notifications...`);

    // Email notifications
    if (notifications.email && notifications.email.length > 0) {
      // In production, send actual emails
      console.log(`      Email: ${notifications.email.join(', ')}`);
    }

    // Slack notifications
    if (notifications.slack) {
      // In production, call Slack webhook
      console.log(`      Slack: ${notifications.slack}`);
    }

    // Custom webhook
    if (notifications.webhook) {
      // In production, POST to webhook
      console.log(`      Webhook: ${notifications.webhook}`);
    }
  }

  /**
   * Get trigger by ID
   */
  async getTrigger(triggerId) {
    const filePath = path.join(this.triggersPath, `${triggerId}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }

  /**
   * List all triggers
   */
  async listTriggers(filters = {}) {
    const files = await fs.readdir(this.triggersPath);
    const triggers = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(this.triggersPath, file), 'utf-8');
        const trigger = JSON.parse(content);

        // Apply filters
        if (filters.enabled !== undefined && trigger.enabled !== filters.enabled) {
          continue;
        }
        if (filters.triggerType && trigger.triggerType !== filters.triggerType) {
          continue;
        }

        triggers.push(trigger);
      }
    }

    return triggers;
  }

  /**
   * Update trigger
   */
  async updateTrigger(triggerId, updates) {
    const trigger = await this.getTrigger(triggerId);
    
    // Merge updates
    Object.assign(trigger, updates);
    trigger.updatedAt = new Date().toISOString();

    // Validate
    this.validateTrigger(trigger);

    // Save
    const filePath = path.join(this.triggersPath, `${triggerId}.json`);
    await fs.writeFile(filePath, JSON.stringify(trigger, null, 2));

    return trigger;
  }

  /**
   * Delete trigger
   */
  async deleteTrigger(triggerId) {
    const filePath = path.join(this.triggersPath, `${triggerId}.json`);
    await fs.unlink(filePath);
    console.log(`   ✅ Trigger deleted: ${triggerId}`);
    return { success: true };
  }

  /**
   * Get execution history
   */
  async getExecutionHistory(filters = {}) {
    const files = await fs.readdir(this.executionHistoryPath);
    const executions = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(this.executionHistoryPath, file), 'utf-8');
        const execution = JSON.parse(content);

        // Apply filters
        if (filters.triggerId && execution.triggerId !== filters.triggerId) {
          continue;
        }
        if (filters.status && execution.status !== filters.status) {
          continue;
        }

        executions.push(execution);
      }
    }

    // Sort by start time (newest first)
    executions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    // Limit results if specified
    if (filters.limit) {
      return executions.slice(0, filters.limit);
    }

    return executions;
  }

  /**
   * Helper: Match file pattern
   */
  matchPattern(file, pattern) {
    const regex = new RegExp(
      '^' + pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.') + '$'
    );
    return regex.test(file);
  }
}

export default AutomatedTestTrigger;

