/**
 * AIQA Phase 4.5: Git Watcher
 * 
 * @author Purushothama Raju
 * @date 12/10/2025
 * @copyright Copyright © 2025 Purushothama Raju
 * 
 * PURPOSE:
 * Monitor git repositories for code changes and automatically trigger relevant tests.
 * Uses RAG to intelligently map code changes to affected test cases.
 * 
 * ARCHITECTURE:
 * 1. Monitor git commits (via webhook or polling)
 * 2. Extract changed files and diff
 * 3. Query RAG for affected tests
 * 4. Auto-trigger test execution
 * 5. Store results back in RAG
 * 
 * CONNECTIONS:
 * - Receives git webhooks (GitHub, GitLab, Bitbucket)
 * - Queries RAG engine for test mapping
 * - Triggers Phase 2 (test execution)
 * - Reports to Phase 6 (unified UI)
 */

import simpleGit from 'simple-git';
import fs from 'fs/promises';
import path from 'path';

export class GitWatcher {
  constructor(ragEngine) {
    this.ragEngine = ragEngine;
    this.git = simpleGit();
    this.watchedRepos = new Map(); // repo path -> config
  }

  /**
   * Add a repository to watch
   * 
   * @param {string} repoPath - Path to git repository
   * @param {Object} config - Configuration options
   */
  async watchRepository(repoPath, config = {}) {
    console.log(`👀 Watching repository: ${repoPath}`);
    
    try {
      // Verify it's a git repo
      const isRepo = await this.git.cwd(repoPath).checkIsRepo();
      if (!isRepo) {
        throw new Error(`Not a git repository: ${repoPath}`);
      }
      
      // Store config
      this.watchedRepos.set(repoPath, {
        path: repoPath,
        branch: config.branch || 'main',
        testExecutorUrl: config.testExecutorUrl || 'http://localhost:3002',
        autoTrigger: config.autoTrigger !== false, // Default true
        testMode: config.testMode || 'smart', // smart | smoke | full
        ...config
      });
      
      console.log(`   ✓ Now watching ${this.watchedRepos.size} repositories`);
      
    } catch (error) {
      console.error(`   ❌ Failed to watch repo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze a git commit
   * 
   * @param {string} repoPath - Repository path
   * @param {string} commitHash - Commit hash to analyze
   * @returns {Object} Analysis results with recommended tests
   */
  async analyzeCommit(repoPath, commitHash = 'HEAD') {
    console.log(`🔍 Analyzing commit: ${commitHash}`);
    
    try {
      const git = simpleGit(repoPath);
      
      // Get commit details
      const log = await git.log([commitHash, '-1']);
      const commit = log.latest;
      
      console.log(`   📝 ${commit.message}`);
      console.log(`   👤 ${commit.author_name} (${commit.author_email})`);
      
      // Get changed files
      const diff = await git.diff([`${commitHash}~1`, commitHash, '--name-only']);
      const changedFiles = diff.split('\n').filter(Boolean);
      
      console.log(`   📁 Changed files: ${changedFiles.length}`);
      changedFiles.forEach(file => console.log(`      - ${file}`));
      
      // Get detailed diff
      const detailedDiff = await git.diff([`${commitHash}~1`, commitHash]);
      
      // Analyze with RAG
      console.log('   🧠 Consulting RAG for affected tests...');
      const analysis = await this.ragEngine.analyzeGitChange({
        commitHash: commit.hash,
        message: commit.message,
        author: commit.author_name,
        timestamp: commit.date,
        changedFiles: changedFiles,
        diff: detailedDiff.slice(0, 5000) // Limit diff size for LLM
      });
      
      return {
        success: true,
        commit: {
          hash: commit.hash,
          message: commit.message,
          author: commit.author_name,
          date: commit.date
        },
        changedFiles: changedFiles,
        ...analysis
      };
      
    } catch (error) {
      console.error(`   ❌ Commit analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process a GitHub webhook
   * 
   * @param {Object} payload - GitHub webhook payload
   * @returns {Object} Processing result
   */
  async processGitHubWebhook(payload) {
    console.log('📥 GitHub webhook received');
    
    try {
      // Extract commit info
      const commits = payload.commits || [];
      console.log(`   📝 ${commits.length} commits in push`);
      
      // Get repository info
      const repoName = payload.repository?.name || 'unknown';
      const branch = payload.ref?.split('/').pop() || 'unknown';
      
      console.log(`   📦 Repository: ${repoName}`);
      console.log(`   🌿 Branch: ${branch}`);
      
      // Process each commit
      const results = [];
      for (const commit of commits) {
        console.log(`\n   🔍 Processing: ${commit.id.slice(0, 7)} - ${commit.message}`);
        
        // Analyze with RAG
        const analysis = await this.ragEngine.analyzeGitChange({
          commitHash: commit.id,
          message: commit.message,
          author: commit.author?.name || 'unknown',
          timestamp: commit.timestamp,
          changedFiles: [
            ...(commit.added || []),
            ...(commit.modified || []),
            ...(commit.removed || [])
          ],
          diff: 'Webhook does not provide full diff'
        });
        
        results.push({
          commit: commit.id.slice(0, 7),
          analysis: analysis
        });
      }
      
      return {
        success: true,
        repository: repoName,
        branch: branch,
        commitsProcessed: commits.length,
        results: results
      };
      
    } catch (error) {
      console.error(`   ❌ Webhook processing failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Auto-trigger tests based on commit analysis
   * 
   * @param {Object} analysis - Commit analysis from RAG
   * @param {string} executorUrl - URL of test executor (Phase 2)
   * @returns {Object} Test execution result
   */
  async triggerTests(analysis, executorUrl = 'http://localhost:3002') {
    console.log('🚀 Auto-triggering tests...');
    
    try {
      const testMode = analysis.riskLevel === 'critical' || analysis.riskLevel === 'high' 
        ? 'full' 
        : 'smoke';
      
      console.log(`   🎯 Test mode: ${testMode}`);
      console.log(`   📋 Recommended tests: ${analysis.recommendedTests?.length || 0}`);
      
      // In a real implementation, this would:
      // 1. Convert recommended tests to Phase 2 format
      // 2. Call Phase 2 executor
      // 3. Wait for results
      // 4. Store results in RAG
      
      // For now, return a placeholder
      return {
        success: true,
        mode: testMode,
        testsTriggered: analysis.recommendedTests?.length || 0,
        message: `Would trigger ${testMode} test suite with ${analysis.recommendedTests?.length || 0} tests`,
        recommendedTests: analysis.recommendedTests
      };
      
    } catch (error) {
      console.error(`   ❌ Test triggering failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Map file paths to feature areas
   * This helps identify which features are affected by code changes
   * 
   * @param {string[]} files - Changed file paths
   * @returns {string[]} Affected feature areas
   */
  mapFilesToFeatures(files) {
    const features = new Set();
    
    // Common mapping patterns
    const patterns = {
      'auth': /auth|login|signup|session|password/i,
      'payment': /payment|checkout|cart|stripe|paypal/i,
      'user-profile': /profile|user|account|settings/i,
      'api': /api|endpoint|route|controller/i,
      'database': /model|schema|migration|db/i,
      'frontend': /component|page|view|ui/i
    };
    
    files.forEach(file => {
      for (const [feature, pattern] of Object.entries(patterns)) {
        if (pattern.test(file)) {
          features.add(feature);
        }
      }
    });
    
    return Array.from(features);
  }

  /**
   * Calculate risk level based on changed files
   * 
   * @param {string[]} files - Changed file paths
   * @returns {string} Risk level (critical|high|medium|low)
   */
  calculateRiskLevel(files) {
    // High-risk patterns
    const critical = /auth|payment|security|admin/i;
    const high = /api|database|model|migration/i;
    const medium = /service|util|helper/i;
    
    if (files.some(f => critical.test(f))) return 'critical';
    if (files.some(f => high.test(f))) return 'high';
    if (files.some(f => medium.test(f))) return 'medium';
    return 'low';
  }

  /**
   * Get watched repositories
   * 
   * @returns {Array} List of watched repos
   */
  getWatchedRepos() {
    return Array.from(this.watchedRepos.values());
  }

  /**
   * Remove a repository from watch list
   * 
   * @param {string} repoPath - Repository path
   */
  unwatchRepository(repoPath) {
    this.watchedRepos.delete(repoPath);
    console.log(`   ✓ Stopped watching: ${repoPath}`);
  }
}

