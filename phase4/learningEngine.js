/**
 * Phase 4: Learning Engine
 * 
 * @author Purushothama Raju
 * @date 12/10/2025
 * @copyright Copyright © 2025 Purushothama Raju
 * 
 * PURPOSE:
 * Learn from test failures and user feedback to continuously improve
 * test accuracy and reliability over time.
 * 
 * CONNECTIONS:
 * - Input: Test results from Phase 2, User feedback
 * - Uses: ML algorithms for pattern recognition
 * - Output: Learnings, recommendations, improvements
 * 
 * ARCHITECTURE:
 * Feedback + Errors → Analysis → Pattern Detection → Knowledge Base → Recommendations
 */

import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

/**
 * Learning Engine Class
 * Collects feedback, analyzes patterns, stores knowledge
 */
class LearningEngine {
  constructor() {
    // AI client for advanced analysis
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Knowledge base path
    // WHY: Store learnings persistently
    this.knowledgeBasePath = './knowledge';
    
    // In-memory cache of learnings
    // WHY: Fast access to recent learnings
    this.learningsCache = [];
  }

  /**
   * Collect user feedback after test execution
   * 
   * PURPOSE: Get human input on what worked and what didn't
   * WHY: Human feedback is the most valuable signal for improvement
   * 
   * @param {string} testId - Test execution ID from Phase 2
   * @param {Object} feedback - User feedback object
   * @returns {Promise<Object>} - Processed feedback with learning ID
   */
  async collectFeedback(testId, feedback) {
    console.log(`\n📝 Collecting feedback for test: ${testId}`);
    
    // Structure feedback
    // WHY: Consistent format for analysis
    const structuredFeedback = {
      id: uuidv4(),
      testId: testId,
      timestamp: new Date().toISOString(),
      
      // User ratings
      // WHY: Quantify success/failure
      overallRating: feedback.overallRating || 0, // 1-5
      accuracyRating: feedback.accuracyRating || 0,
      speedRating: feedback.speedRating || 0,
      
      // What went right
      // WHY: Reinforce successful patterns
      successfulSteps: feedback.successfulSteps || [],
      whatWorked: feedback.whatWorked || '',
      
      // What went wrong
      // WHY: Identify areas for improvement
      failedSteps: feedback.failedSteps || [],
      whatFailed: feedback.whatFailed || '',
      expectedBehavior: feedback.expectedBehavior || '',
      
      // Suggestions
      // WHY: User knows best what they need
      userSuggestions: feedback.userSuggestions || '',
      
      // Context
      pageUrl: feedback.pageUrl || '',
      testDescription: feedback.testDescription || ''
    };
    
    // Save feedback to disk
    await this.saveFeedback(structuredFeedback);
    
    // Analyze feedback immediately
    // CONNECTION: Trigger learning process
    const learnings = await this.analyzeFeedback(structuredFeedback);
    
    console.log(`   ✅ Feedback collected and analyzed`);
    console.log(`   📊 Generated ${learnings.insights.length} insights`);
    
    return {
      feedbackId: structuredFeedback.id,
      learnings: learnings
    };
  }

  /**
   * Analyze test execution errors
   * 
   * PURPOSE: Extract patterns from failures
   * WHY: Errors contain valuable information about what needs fixing
   * 
   * @param {Object} testReport - Test report from Phase 2
   * @returns {Promise<Object>} - Error analysis and patterns
   */
  async analyzeErrors(testReport) {
    console.log(`\n🔍 Analyzing errors from test: ${testReport.testId}`);
    
    // Extract all errors from test
    const errors = {
      stepErrors: [],
      networkErrors: [],
      consoleErrors: [],
      pageErrors: []
    };
    
    // Collect errors from each step
    testReport.steps.forEach(step => {
      if (step.status === 'failed') {
        errors.stepErrors.push({
          stepNumber: step.stepNumber,
          action: step.action,
          target: step.target,
          error: step.error,
          description: step.description
        });
      }
      
      // Collect advanced logging errors
      if (step.networkErrors?.length > 0) {
        errors.networkErrors.push(...step.networkErrors);
      }
      if (step.consoleErrors?.length > 0) {
        errors.consoleErrors.push(...step.consoleErrors);
      }
      if (step.pageErrors?.length > 0) {
        errors.pageErrors.push(...step.pageErrors);
      }
    });
    
    // Identify patterns
    // WHY: Similar errors suggest systematic issues
    const patterns = this.identifyErrorPatterns(errors);
    
    // Use AI for deep analysis
    // WHY: AI can understand complex error relationships
    const aiInsights = await this.getAIErrorInsights(errors, testReport);
    
    // Store learnings
    const learning = {
      id: uuidv4(),
      type: 'error_analysis',
      testId: testReport.testId,
      timestamp: new Date().toISOString(),
      errors: errors,
      patterns: patterns,
      aiInsights: aiInsights,
      recommendations: this.generateRecommendations(errors, patterns, aiInsights)
    };
    
    await this.saveLearning(learning);
    
    console.log(`   ✅ Error analysis complete`);
    console.log(`   🎯 Found ${patterns.length} patterns`);
    console.log(`   💡 Generated ${learning.recommendations.length} recommendations`);
    
    return learning;
  }

  /**
   * Analyze user feedback to extract learnings
   * 
   * PURPOSE: Convert human feedback into actionable insights
   * 
   * @param {Object} feedback - Structured feedback
   * @returns {Promise<Object>} - Learnings and insights
   */
  async analyzeFeedback(feedback) {
    const insights = [];
    
    // Insight 1: Overall test quality
    if (feedback.overallRating < 3) {
      insights.push({
        type: 'quality_issue',
        severity: 'high',
        message: 'Test received low rating',
        suggestion: 'Review test steps and descriptions'
      });
    }
    
    // Insight 2: Successful patterns
    if (feedback.successfulSteps.length > 0) {
      insights.push({
        type: 'successful_pattern',
        severity: 'info',
        message: `${feedback.successfulSteps.length} steps worked well`,
        details: feedback.successfulSteps,
        suggestion: 'Replicate these patterns in future tests'
      });
    }
    
    // Insight 3: Failure patterns
    if (feedback.failedSteps.length > 0) {
      insights.push({
        type: 'failure_pattern',
        severity: 'high',
        message: `${feedback.failedSteps.length} steps failed`,
        details: feedback.failedSteps,
        suggestion: 'Investigate and fix these failures'
      });
    }
    
    // Insight 4: User suggestions
    if (feedback.userSuggestions) {
      insights.push({
        type: 'user_suggestion',
        severity: 'medium',
        message: 'User provided improvement suggestions',
        details: feedback.userSuggestions,
        suggestion: 'Implement user feedback'
      });
    }
    
    // Use AI for deeper analysis
    // WHY: AI can understand nuanced feedback
    if (feedback.whatFailed || feedback.whatWorked) {
      const aiAnalysis = await this.analyzeUserFeedbackWithAI(feedback);
      insights.push(...aiAnalysis);
    }
    
    return {
      feedbackId: feedback.id,
      insights: insights,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Identify patterns in errors
   * 
   * PURPOSE: Find recurring issues
   * WHY: Patterns indicate systematic problems
   * 
   * @param {Object} errors - Collected errors
   * @returns {Array} - Identified patterns
   */
  identifyErrorPatterns(errors) {
    const patterns = [];
    
    // Pattern 1: Timeout errors
    const timeoutErrors = errors.stepErrors.filter(e => 
      e.error && e.error.includes('Timeout')
    );
    if (timeoutErrors.length > 0) {
      patterns.push({
        type: 'timeout_pattern',
        count: timeoutErrors.length,
        description: 'Multiple timeout errors detected',
        suggestion: 'Increase wait times or check element selectors',
        affectedSteps: timeoutErrors.map(e => e.stepNumber)
      });
    }
    
    // Pattern 2: Element not found
    const notFoundErrors = errors.stepErrors.filter(e =>
      e.error && (e.error.includes('not found') || e.error.includes('waiting for locator'))
    );
    if (notFoundErrors.length > 0) {
      patterns.push({
        type: 'element_not_found_pattern',
        count: notFoundErrors.length,
        description: 'Multiple "element not found" errors',
        suggestion: 'Use Phase 3 AI Web Reader for better element finding',
        affectedSteps: notFoundErrors.map(e => e.stepNumber)
      });
    }
    
    // Pattern 3: Network errors
    if (errors.networkErrors.length > 0) {
      const failedUrls = errors.networkErrors.map(e => e.url);
      patterns.push({
        type: 'network_error_pattern',
        count: errors.networkErrors.length,
        description: 'Network requests failing',
        suggestion: 'Check API endpoints and network connectivity',
        affectedUrls: [...new Set(failedUrls)]
      });
    }
    
    // Pattern 4: Console errors
    if (errors.consoleErrors.length > 3) {
      patterns.push({
        type: 'console_error_pattern',
        count: errors.consoleErrors.length,
        description: 'Multiple JavaScript errors on page',
        suggestion: 'Page may have broken functionality - investigate console errors',
        severity: 'high'
      });
    }
    
    // Pattern 5: Same selector failing multiple times
    const selectorFailures = {};
    errors.stepErrors.forEach(e => {
      if (e.target) {
        selectorFailures[e.target] = (selectorFailures[e.target] || 0) + 1;
      }
    });
    
    Object.entries(selectorFailures).forEach(([selector, count]) => {
      if (count > 1) {
        patterns.push({
          type: 'unreliable_selector',
          selector: selector,
          failureCount: count,
          description: `Selector "${selector}" failed ${count} times`,
          suggestion: 'This selector is unreliable - use Phase 3 to find better selector',
          severity: 'high'
        });
      }
    });
    
    return patterns;
  }

  /**
   * Get AI insights on errors
   * 
   * PURPOSE: Use AI to understand complex error relationships
   * 
   * @param {Object} errors - Collected errors
   * @param {Object} testReport - Full test report
   * @returns {Promise<Array>} - AI-generated insights
   */
  async getAIErrorInsights(errors, testReport) {
    try {
      // Build prompt for AI
      const prompt = `Analyze these test execution errors and provide insights:

TEST: ${testReport.testId}
TOTAL STEPS: ${testReport.totalSteps}
PASSED: ${testReport.passedSteps}
FAILED: ${testReport.failedSteps}

STEP ERRORS:
${errors.stepErrors.map(e => `- Step ${e.stepNumber} (${e.action}): ${e.error}`).join('\n')}

NETWORK ERRORS: ${errors.networkErrors.length}
CONSOLE ERRORS: ${errors.consoleErrors.length}
PAGE ERRORS: ${errors.pageErrors.length}

Provide 3-5 specific, actionable insights about:
1. Root causes of failures
2. Relationships between errors
3. Recommendations for fixes

Output as JSON array of insights:
[
  {
    "insight": "specific observation",
    "rootCause": "underlying issue",
    "recommendation": "how to fix",
    "priority": "high|medium|low"
  }
]`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a test automation expert. Analyze errors and provide actionable insights. Output only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });
      
      let response = completion.choices[0].message.content;
      
      // Parse JSON
      if (response.startsWith('```')) {
        response = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }
      
      const insights = JSON.parse(response);
      return insights;
      
    } catch (error) {
      console.error(`   ⚠️  AI insights error: ${error.message}`);
      return [];
    }
  }

  /**
   * Analyze user feedback with AI
   */
  async analyzeUserFeedbackWithAI(feedback) {
    try {
      const prompt = `Analyze this user feedback on a test execution:

RATING: ${feedback.overallRating}/5
WHAT WORKED: ${feedback.whatWorked}
WHAT FAILED: ${feedback.whatFailed}
EXPECTED: ${feedback.expectedBehavior}
SUGGESTIONS: ${feedback.userSuggestions}

Extract 2-3 key insights and actionable recommendations.

Output as JSON array:
[
  {
    "type": "insight_type",
    "severity": "high|medium|low",
    "message": "key insight",
    "suggestion": "specific action"
  }
]`;

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are a QA expert. Analyze user feedback and extract actionable insights. Output only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      });
      
      let response = completion.choices[0].message.content;
      if (response.startsWith('```')) {
        response = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }
      
      return JSON.parse(response);
      
    } catch (error) {
      console.error(`   ⚠️  AI feedback analysis error: ${error.message}`);
      return [];
    }
  }

  /**
   * Generate recommendations based on analysis
   */
  generateRecommendations(errors, patterns, aiInsights) {
    const recommendations = [];
    
    // From patterns
    patterns.forEach(pattern => {
      recommendations.push({
        source: 'pattern_analysis',
        type: pattern.type,
        priority: pattern.severity || 'medium',
        recommendation: pattern.suggestion,
        details: pattern
      });
    });
    
    // From AI
    aiInsights.forEach(insight => {
      recommendations.push({
        source: 'ai_analysis',
        type: insight.insight || 'ai_insight',
        priority: insight.priority || 'medium',
        recommendation: insight.recommendation,
        details: insight
      });
    });
    
    return recommendations;
  }

  /**
   * Save feedback to disk
   */
  async saveFeedback(feedback) {
    const feedbackDir = path.join(this.knowledgeBasePath, 'feedback');
    await fs.mkdir(feedbackDir, { recursive: true });
    
    const filename = `feedback_${feedback.id}.json`;
    const filepath = path.join(feedbackDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(feedback, null, 2));
  }

  /**
   * Save learning to knowledge base
   */
  async saveLearning(learning) {
    const learningsDir = path.join(this.knowledgeBasePath, 'learnings');
    await fs.mkdir(learningsDir, { recursive: true });
    
    const filename = `learning_${learning.id}.json`;
    const filepath = path.join(learningsDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(learning, null, 2));
    
    // Add to cache
    this.learningsCache.push(learning);
    
    // Keep cache size manageable
    if (this.learningsCache.length > 100) {
      this.learningsCache.shift();
    }
  }

  /**
   * Get recent learnings
   */
  async getRecentLearnings(limit = 10) {
    const learningsDir = path.join(this.knowledgeBasePath, 'learnings');
    
    try {
      const files = await fs.readdir(learningsDir);
      const learnings = await Promise.all(
        files.slice(-limit).map(async (file) => {
          const content = await fs.readFile(path.join(learningsDir, file), 'utf-8');
          return JSON.parse(content);
        })
      );
      
      return learnings.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
    } catch {
      return [];
    }
  }

  /**
   * Get insights summary
   */
  async getInsightsSummary() {
    const learnings = await this.getRecentLearnings(50);
    
    const summary = {
      totalLearnings: learnings.length,
      patterns: {},
      topRecommendations: [],
      successRate: 0
    };
    
    // Aggregate patterns
    learnings.forEach(learning => {
      if (learning.patterns) {
        learning.patterns.forEach(pattern => {
          summary.patterns[pattern.type] = (summary.patterns[pattern.type] || 0) + 1;
        });
      }
    });
    
    // Get top recommendations
    const allRecommendations = learnings.flatMap(l => l.recommendations || []);
    const recCounts = {};
    allRecommendations.forEach(rec => {
      recCounts[rec.recommendation] = (recCounts[rec.recommendation] || 0) + 1;
    });
    
    summary.topRecommendations = Object.entries(recCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([rec, count]) => ({ recommendation: rec, frequency: count }));
    
    return summary;
  }
}

/**
 * Export Learning Engine
 * CONNECTION: Used by Phase 4 server and integrated with other phases
 */
export default LearningEngine;

