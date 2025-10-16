/**
 * Test Suites API
 * 
 * PURPOSE: Manage test suites, folders, and organized test execution
 * 
 * FEATURES:
 * - Nested folder structure
 * - Multiple tests per folder
 * - Sequential/Parallel execution
 * - Tags (smoke, regression, critical)
 * - Export/Import
 * - Clone/Duplicate
 * - Schedule runs
 * - Live execution status tracking
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUITES_DIR = path.join(__dirname, 'test-suites');

/**
 * In-memory execution state tracking
 * 
 * PURPOSE: Track live test execution status for polling
 * Structure designed for easy WebSocket upgrade later
 */
const executionState = {
  // suiteId: {
  //   status: 'running' | 'completed' | 'idle',
  //   startTime: timestamp,
  //   endTime: timestamp,
  //   progress: { completed: 2, total: 5, percentage: 40 },
  //   tests: {
  //     testId: {
  //       status: 'queued' | 'running' | 'passed' | 'failed',
  //       currentStep: 3,
  //       totalSteps: 10,
  //       startTime: timestamp,
  //       duration: 5000
  //     }
  //   }
  // }
};

/**
 * Initialize test suites storage
 */
async function initializeSuites() {
  try {
    await fs.access(SUITES_DIR);
  } catch {
    await fs.mkdir(SUITES_DIR, { recursive: true });
  }
}

/**
 * Generate unique ID
 */
function generateId() {
  return `suite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get all test suites (with nested structure)
 */
async function getAllSuites() {
  await initializeSuites();
  
  try {
    const files = await fs.readdir(SUITES_DIR);
    const suites = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(path.join(SUITES_DIR, file), 'utf-8');
        suites.push(JSON.parse(content));
      }
    }
    
    return suites;
  } catch (error) {
    console.error('Error reading suites:', error);
    return [];
  }
}

/**
 * Get suite by ID
 */
async function getSuite(suiteId) {
  await initializeSuites();
  
  try {
    const filePath = path.join(SUITES_DIR, `${suiteId}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Create new test suite
 */
async function createSuite(suiteData) {
  await initializeSuites();
  
  const suite = {
    id: generateId(),
    name: suiteData.name,
    description: suiteData.description || '',
    parentId: suiteData.parentId || null, // For nested folders
    type: suiteData.type || 'folder', // 'folder' or 'test'
    tests: suiteData.tests || [],
    tags: suiteData.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastRun: null,
    stats: {
      totalRuns: 0,
      totalTests: suiteData.tests?.length || 0,
      successRate: 0
    },
    schedule: null // For scheduled runs
  };
  
  const filePath = path.join(SUITES_DIR, `${suite.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(suite, null, 2));
  
  return suite;
}

/**
 * Update existing suite
 */
async function updateSuite(suiteId, updates) {
  const suite = await getSuite(suiteId);
  if (!suite) {
    throw new Error('Suite not found');
  }
  
  const updated = {
    ...suite,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  // Update test count
  if (updates.tests) {
    updated.stats.totalTests = updates.tests.length;
  }
  
  const filePath = path.join(SUITES_DIR, `${suiteId}.json`);
  await fs.writeFile(filePath, JSON.stringify(updated, null, 2));
  
  return updated;
}

/**
 * Delete suite
 */
async function deleteSuite(suiteId) {
  const filePath = path.join(SUITES_DIR, `${suiteId}.json`);
  
  try {
    await fs.unlink(filePath);
    
    // Also delete child suites (nested)
    const allSuites = await getAllSuites();
    const children = allSuites.filter(s => s.parentId === suiteId);
    
    for (const child of children) {
      await deleteSuite(child.id);
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Add test to suite
 */
async function addTestToSuite(suiteId, test) {
  const suite = await getSuite(suiteId);
  if (!suite) {
    throw new Error('Suite not found');
  }
  
  const newTest = {
    id: generateId(),
    name: test.name,
    description: test.description || '',
    steps: test.steps || [],
    tags: test.tags || [],
    enabled: true,
    createdAt: new Date().toISOString(),
    lastRun: null,
    lastResult: null
  };
  
  suite.tests.push(newTest);
  
  return await updateSuite(suiteId, { tests: suite.tests });
}

/**
 * Remove test from suite
 */
async function removeTestFromSuite(suiteId, testId) {
  const suite = await getSuite(suiteId);
  if (!suite) {
    throw new Error('Suite not found');
  }
  
  suite.tests = suite.tests.filter(t => t.id !== testId);
  
  return await updateSuite(suiteId, { tests: suite.tests });
}

/**
 * Update test in suite
 */
async function updateTestInSuite(suiteId, testId, updates) {
  const suite = await getSuite(suiteId);
  if (!suite) {
    throw new Error('Suite not found');
  }
  
  const testIndex = suite.tests.findIndex(t => t.id === testId);
  if (testIndex === -1) {
    throw new Error('Test not found');
  }
  
  suite.tests[testIndex] = {
    ...suite.tests[testIndex],
    ...updates
  };
  
  return await updateSuite(suiteId, { tests: suite.tests });
}

/**
 * Clone/Duplicate suite
 */
async function cloneSuite(suiteId) {
  const suite = await getSuite(suiteId);
  if (!suite) {
    throw new Error('Suite not found');
  }
  
  const cloned = {
    ...suite,
    id: undefined, // Will be generated
    name: `${suite.name} (Copy)`,
    createdAt: undefined,
    updatedAt: undefined,
    lastRun: null,
    stats: {
      totalRuns: 0,
      totalTests: suite.tests.length,
      successRate: 0
    }
  };
  
  // Clone all tests with new IDs
  cloned.tests = suite.tests.map(test => ({
    ...test,
    id: generateId(),
    createdAt: new Date().toISOString(),
    lastRun: null,
    lastResult: null
  }));
  
  return await createSuite(cloned);
}

/**
 * Export suite (with all nested suites)
 */
async function exportSuite(suiteId) {
  const suite = await getSuite(suiteId);
  if (!suite) {
    throw new Error('Suite not found');
  }
  
  const allSuites = await getAllSuites();
  const children = allSuites.filter(s => s.parentId === suiteId);
  
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    suite: suite,
    children: []
  };
  
  // Recursively export children
  for (const child of children) {
    const childData = await exportSuite(child.id);
    exportData.children.push(childData);
  }
  
  return exportData;
}

/**
 * Import suite
 */
async function importSuite(importData, parentId = null) {
  const suiteData = {
    ...importData.suite,
    parentId: parentId,
    id: undefined // Generate new ID
  };
  
  const newSuite = await createSuite(suiteData);
  
  // Import children
  if (importData.children && importData.children.length > 0) {
    for (const child of importData.children) {
      await importSuite(child, newSuite.id);
    }
  }
  
  return newSuite;
}

/**
 * Get suite tree (hierarchical structure)
 */
async function getSuiteTree() {
  const allSuites = await getAllSuites();
  
  // Build tree structure
  const tree = [];
  const suiteMap = {};
  
  // First pass: create map
  allSuites.forEach(suite => {
    suiteMap[suite.id] = { ...suite, children: [] };
  });
  
  // Second pass: build tree
  allSuites.forEach(suite => {
    if (suite.parentId && suiteMap[suite.parentId]) {
      suiteMap[suite.parentId].children.push(suiteMap[suite.id]);
    } else if (!suite.parentId) {
      tree.push(suiteMap[suite.id]);
    }
  });
  
  return tree;
}

/**
 * Update suite stats after run
 */
async function updateSuiteStats(suiteId, runResult) {
  const suite = await getSuite(suiteId);
  if (!suite) {
    return;
  }
  
  const totalPassed = runResult.results.filter(r => r.success).length;
  const totalTests = runResult.results.length;
  
  const newStats = {
    totalRuns: suite.stats.totalRuns + 1,
    totalTests: suite.stats.totalTests,
    successRate: Math.round((totalPassed / totalTests) * 100)
  };
  
  await updateSuite(suiteId, {
    lastRun: new Date().toISOString(),
    stats: newStats
  });
}

/**
 * Schedule suite run
 */
async function scheduleSuite(suiteId, scheduleData) {
  const suite = await getSuite(suiteId);
  if (!suite) {
    throw new Error('Suite not found');
  }
  
  const schedule = {
    enabled: scheduleData.enabled !== false,
    type: scheduleData.type || 'cron', // 'cron', 'interval', 'once'
    expression: scheduleData.expression, // Cron expression or interval
    nextRun: calculateNextRun(scheduleData),
    options: scheduleData.options || {}
  };
  
  return await updateSuite(suiteId, { schedule });
}

/**
 * Calculate next run time
 */
function calculateNextRun(scheduleData) {
  // Simplified - in production, use a cron library
  const now = new Date();
  
  if (scheduleData.type === 'once') {
    return new Date(scheduleData.expression);
  }
  
  if (scheduleData.type === 'interval') {
    const interval = parseInt(scheduleData.expression);
    return new Date(now.getTime() + interval * 60000); // minutes
  }
  
  // For cron, return approximate next run
  return new Date(now.getTime() + 86400000); // 24 hours
}

/**
 * Get suites by tag
 */
async function getSuitesByTag(tag) {
  const allSuites = await getAllSuites();
  return allSuites.filter(suite => suite.tags && suite.tags.includes(tag));
}

/**
 * Search suites
 */
async function searchSuites(query) {
  const allSuites = await getAllSuites();
  const lowerQuery = query.toLowerCase();
  
  return allSuites.filter(suite =>
    suite.name.toLowerCase().includes(lowerQuery) ||
    suite.description.toLowerCase().includes(lowerQuery) ||
    suite.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

/**
 * =============================================================================
 * LIVE EXECUTION STATUS TRACKING
 * =============================================================================
 * 
 * PURPOSE: Track test execution in real-time for polling
 * DESIGNED FOR: Easy upgrade to WebSocket later
 */

/**
 * Initialize suite execution state
 * 
 * @param {string} suiteId - Suite ID
 * @param {number} totalTests - Total number of tests
 */
function initExecutionState(suiteId, totalTests) {
  executionState[suiteId] = {
    status: 'running',
    startTime: Date.now(),
    endTime: null,
    progress: {
      completed: 0,
      total: totalTests,
      percentage: 0
    },
    tests: {}
  };
  
  console.log(`📊 Initialized execution state for suite: ${suiteId}`);
}

/**
 * Update test status in execution state
 * 
 * @param {string} suiteId - Suite ID
 * @param {string} testId - Test ID
 * @param {string} status - Test status (queued|running|passed|failed)
 * @param {object} details - Additional details (currentStep, totalSteps, etc.)
 */
function updateTestStatus(suiteId, testId, status, details = {}) {
  if (!executionState[suiteId]) {
    console.warn(`⚠️ No execution state for suite: ${suiteId}`);
    return;
  }
  
  if (!executionState[suiteId].tests[testId]) {
    executionState[suiteId].tests[testId] = {
      status: 'queued',
      currentStep: 0,
      totalSteps: details.totalSteps || 0,
      startTime: null,
      duration: null,
      error: null
    };
  }
  
  const test = executionState[suiteId].tests[testId];
  test.status = status;
  
  if (status === 'running' && !test.startTime) {
    test.startTime = Date.now();
  }
  
  if (status === 'passed' || status === 'failed') {
    test.duration = test.startTime ? Date.now() - test.startTime : 0;
    
    // Update suite progress
    executionState[suiteId].progress.completed++;
    executionState[suiteId].progress.percentage = Math.round(
      (executionState[suiteId].progress.completed / executionState[suiteId].progress.total) * 100
    );
  }
  
  if (details.currentStep !== undefined) test.currentStep = details.currentStep;
  if (details.totalSteps !== undefined) test.totalSteps = details.totalSteps;
  if (details.error) test.error = details.error;
  
  console.log(`📊 Updated test status: ${testId} -> ${status}`);
}

/**
 * Queue multiple tests
 * 
 * @param {string} suiteId - Suite ID
 * @param {array} testIds - Array of test IDs to queue
 */
function queueTests(suiteId, testIds) {
  if (!executionState[suiteId]) {
    console.warn(`⚠️ No execution state for suite: ${suiteId}`);
    return;
  }
  
  testIds.forEach(testId => {
    updateTestStatus(suiteId, testId, 'queued');
  });
  
  console.log(`📊 Queued ${testIds.length} tests for suite: ${suiteId}`);
}

/**
 * Complete suite execution
 * 
 * @param {string} suiteId - Suite ID
 */
function completeExecution(suiteId) {
  if (!executionState[suiteId]) {
    console.warn(`⚠️ No execution state for suite: ${suiteId}`);
    return;
  }
  
  executionState[suiteId].status = 'completed';
  executionState[suiteId].endTime = Date.now();
  
  console.log(`📊 Completed execution for suite: ${suiteId}`);
  
  // Clean up after 5 minutes
  setTimeout(() => {
    delete executionState[suiteId];
    console.log(`🧹 Cleaned up execution state for suite: ${suiteId}`);
  }, 5 * 60 * 1000);
}

/**
 * Get execution status for a suite
 * 
 * @param {string} suiteId - Suite ID
 * @returns {object|null} - Execution status or null if not found
 */
function getExecutionStatus(suiteId) {
  if (!executionState[suiteId]) {
    return null;
  }
  
  // Calculate overall duration
  const duration = executionState[suiteId].endTime 
    ? executionState[suiteId].endTime - executionState[suiteId].startTime
    : Date.now() - executionState[suiteId].startTime;
  
  // Count test statuses
  const testStatuses = Object.values(executionState[suiteId].tests);
  const counts = {
    queued: testStatuses.filter(t => t.status === 'queued').length,
    running: testStatuses.filter(t => t.status === 'running').length,
    passed: testStatuses.filter(t => t.status === 'passed').length,
    failed: testStatuses.filter(t => t.status === 'failed').length
  };
  
  return {
    suiteId,
    status: executionState[suiteId].status,
    startTime: executionState[suiteId].startTime,
    endTime: executionState[suiteId].endTime,
    duration,
    progress: executionState[suiteId].progress,
    counts,
    tests: executionState[suiteId].tests
  };
}

/**
 * Get all active executions
 * 
 * @returns {object} - All active execution states
 */
function getAllExecutions() {
  const active = {};
  
  for (const suiteId in executionState) {
    if (executionState[suiteId].status === 'running') {
      active[suiteId] = getExecutionStatus(suiteId);
    }
  }
  
  return active;
}

/**
 * Clear execution state (for testing/cleanup)
 * 
 * @param {string} suiteId - Suite ID (optional, clears all if not provided)
 */
function clearExecutionState(suiteId = null) {
  if (suiteId) {
    delete executionState[suiteId];
    console.log(`🧹 Cleared execution state for suite: ${suiteId}`);
  } else {
    Object.keys(executionState).forEach(key => delete executionState[key]);
    console.log(`🧹 Cleared all execution states`);
  }
}

export {
  initializeSuites,
  getAllSuites,
  getSuite,
  createSuite,
  updateSuite,
  deleteSuite,
  addTestToSuite,
  removeTestFromSuite,
  updateTestInSuite,
  cloneSuite,
  exportSuite,
  importSuite,
  getSuiteTree,
  updateSuiteStats,
  scheduleSuite,
  getSuitesByTag,
  searchSuites,
  // Live execution tracking
  initExecutionState,
  updateTestStatus,
  queueTests,
  completeExecution,
  getExecutionStatus,
  getAllExecutions,
  clearExecutionState
};

