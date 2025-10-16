/**
 * Phase 2 Test Server
 * 
 * PURPOSE:
 * Provides API and UI to test the Screenshot & Logs system
 * 
 * CONNECTIONS:
 * - Uses: executor.js (test execution with logging)
 * - Integrates: Phase 1 test steps as input
 * - Serves: Test UI for visualization
 * 
 * ARCHITECTURE:
 * Phase 1 Steps → API → Executor → Screenshots + Logs → UI Display
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs/promises';
import TestExecutor from './executor.js';

// ES Module path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
const PORT = 3002;  // Different port from Phase 1

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Serve artifacts directory
// WHY: Allow UI to display screenshots and reports
app.use('/artifacts', express.static(path.join(__dirname, 'artifacts')));

/**
 * API: Execute test steps with logging and screenshots
 * 
 * ENDPOINT: POST /api/execute
 * INPUT: { "steps": [...], "options": {...} }
 * OUTPUT: { "success": true, "report": {...}, "testId": "..." }
 * 
 * PURPOSE: Main execution endpoint for Phase 2
 * CONNECTION: Takes Phase 1 output as input
 */
app.post('/api/execute', async (req, res) => {
  try {
    const { steps, assertions = [], options = {} } = req.body;
    
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing or invalid steps array'
      });
    }
    
    console.log('\n📥 Received test execution request');
    console.log(`   Steps: ${steps.length}`);
    console.log(`   Assertions: ${assertions.length}`);
    console.log(`   Options:`, options);
    
    // Create executor
    const executor = new TestExecutor();
    
    // Execute test with logging and screenshots
    // CONNECTION: This is where Phase 2 magic happens
    const report = await executor.executeTest(steps, {
      headless: options.headless || false,
      continueOnFailure: options.continueOnFailure || false
    });
    
    // Execute assertions if provided
    let assertionResults = null;
    if (assertions && assertions.length > 0) {
      console.log(`\n🎯 Running ${assertions.length} assertion(s)...`);
      assertionResults = await executor.executeAssertions(assertions);
      
      // Update report success based on assertions
      if (assertionResults.failed.length > 0) {
        report.success = false;
        report.assertionsFailed = assertionResults.failed.length;
      }
    }
    
    // Add assertions to report
    report.assertions = assertionResults;
    
    // Return complete report
    res.json({
      success: report.success,
      report: report,
      testId: report.testId,
      artifactsUrl: `/artifacts/${report.testId}`
    });
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * API: Get test report by ID
 * 
 * ENDPOINT: GET /api/report/:testId
 * OUTPUT: Complete test report with all logs and screenshots
 * 
 * PURPOSE: Retrieve previously executed test results
 */
app.get('/api/report/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    const reportPath = path.join(__dirname, 'artifacts', testId, 'report.json');
    
    const reportData = await fs.readFile(reportPath, 'utf-8');
    const report = JSON.parse(reportData);
    
    res.json({
      success: true,
      report: report,
      artifactsUrl: `/artifacts/${testId}`
    });
    
  } catch (error) {
    res.status(404).json({
      success: false,
      error: 'Test report not found'
    });
  }
});

/**
 * API: List all test executions
 * 
 * ENDPOINT: GET /api/tests
 * OUTPUT: List of all test IDs with metadata
 */
app.get('/api/tests', async (req, res) => {
  try {
    const artifactsDir = path.join(__dirname, 'artifacts');
    
    try {
      const testDirs = await fs.readdir(artifactsDir);
      
      const tests = await Promise.all(
        testDirs.map(async (testId) => {
          try {
            const reportPath = path.join(artifactsDir, testId, 'report.json');
            const reportData = await fs.readFile(reportPath, 'utf-8');
            const report = JSON.parse(reportData);
            
            return {
              testId: testId,
              timestamp: report.timestamp,
              totalSteps: report.totalSteps,
              passed: report.passedSteps,
              failed: report.failedSteps,
              success: report.success,
              duration: report.duration
            };
          } catch {
            return null;
          }
        })
      );
      
      // Filter out nulls and sort by timestamp
      const validTests = tests.filter(t => t !== null)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      res.json({
        success: true,
        tests: validTests
      });
      
    } catch {
      // No tests yet
      res.json({
        success: true,
        tests: []
      });
    }
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    phase: 2,
    description: 'Screenshot & Logs System',
    timestamp: new Date().toISOString()
  });
});

/**
 * Serve the test UI
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  AIQA PHASE 2 - TEST SERVER                    ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  🚀 Server running on http://localhost:${PORT}                  ║
║                                                                ║
║  📸 Phase 2: Screenshot & Logs System                          ║
║                                                                ║
║  Features:                                                     ║
║   ✅ Screenshot capture (before/after/failure)                 ║
║   ✅ Expected vs Actual logging                                ║
║   ✅ Behavior comparison                                       ║
║   ✅ Full execution reports                                    ║
║                                                                ║
║  API Endpoints:                                                ║
║   POST /api/execute     - Execute test steps                  ║
║   GET  /api/report/:id  - Get test report                     ║
║   GET  /api/tests       - List all tests                      ║
║                                                                ║
║  Integration:                                                  ║
║   → Takes Phase 1 test steps as input                         ║
║   → Executes with Playwright                                  ║
║   → Captures screenshots and logs                             ║
║                                                                ║
║  Next: Test this phase before moving to Phase 3               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

export default app;

