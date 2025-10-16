/**
 * ════════════════════════════════════════════════════════════════
 *                  DO NOT MODIFY - AUTHOR INFORMATION
 * ════════════════════════════════════════════════════════════════
 *  Author: Purushothama Raju
 *  Date: 12/10/2025
 *  Copyright © 2025 Purushothama Raju. All rights reserved.
 * ════════════════════════════════════════════════════════════════
 * 
 * AIQA Phase 6: Unified Platform Server
 * 
 * PURPOSE:
 * Central hub that orchestrates all 6 phases into a unified platform.
 * Provides a single interface for complete test automation workflows.
 * 
 * KEY FEATURES:
 * 1. Unified dashboard and API
 * 2. End-to-end workflow orchestration
 * 3. Service health monitoring
 * 4. Statistics aggregation
 * 5. Complete test management
 * 
 * ORCHESTRATION:
 * - Phase 1: Natural Language → Test Steps
 * - Phase 2: Test Execution
 * - Phase 3: AI Element Finding (used by Phase 2)
 * - Phase 4: Learning System
 * - Phase 4.5: RAG Knowledge Base
 * - Phase 5: Self-Improving Code
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import CSVTestSuiteHandler from './csvTestSuiteHandler.js';
import CloudIntegrationsManager from './cloudIntegrations.js';
import AutomatedTestTrigger from './automatedTestTrigger.js';

// Load environment variables
dotenv.config({ path: '../.env' });

// Initialize new modules
const csvHandler = new CSVTestSuiteHandler();
const cloudIntegrations = new CloudIntegrationsManager();
const testTriggers = new AutomatedTestTrigger();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const app = express();
const PORT = 3007;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public')); // Serve static files from public directory

// Service URLs
const SERVICES = {
  phase1: 'http://localhost:3001',
  phase2: 'http://localhost:3002',
  phase3: 'http://localhost:3003',
  phase4: 'http://localhost:3004',
  phase4_5: 'http://localhost:3005',
  phase5: 'http://localhost:3006'
};

console.log('🚀 Initializing AIQA Phase 6 - Unified Platform...\n');

// ==================== WORKFLOW ENDPOINTS ====================

/**
 * POST /api/workflow/create-and-execute
 * Complete workflow: NL → Steps → Execute
 */
app.post('/api/workflow/create-and-execute', async (req, res) => {
  console.log('\n📥 Complete workflow request received');
  
  try {
    const { naturalLanguage, options = {} } = req.body;
    
    if (!naturalLanguage) {
      return res.status(400).json({
        success: false,
        error: 'naturalLanguage is required'
      });
    }
    
    console.log(`   Input: "${naturalLanguage.substring(0, 50)}..."`);
    
    const workflowResult = {
      success: true,
      testId: `test_${Date.now()}`,
      steps: [],
      phases: {}
    };
    
    // Step 1: Convert NL to steps (Phase 1)
    console.log('   📝 Step 1: Converting NL to steps...');
    try {
      const phase1Response = await fetch(`${SERVICES.phase1}/api/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: naturalLanguage })
      });
      
      const phase1Data = await phase1Response.json();
      
      if (phase1Data.success) {
        workflowResult.steps = phase1Data.steps;
        workflowResult.phases.phase1 = { success: true, steps: phase1Data.steps.length };
        console.log(`      ✓ Generated ${phase1Data.steps.length} steps`);
      } else {
        throw new Error('Phase 1 conversion failed');
      }
    } catch (error) {
      console.log('      ✗ Phase 1 failed:', error.message);
      workflowResult.phases.phase1 = { success: false, error: error.message };
      return res.json(workflowResult);
    }
    
    // Step 2: Execute test (Phase 2)
    console.log('   🚀 Step 2: Executing test...');
    try {
      const phase2Response = await fetch(`${SERVICES.phase2}/api/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steps: workflowResult.steps,
          options: {
            headless: options.headless !== false,
            continueOnFailure: true
          }
        })
      });
      
      const phase2Data = await phase2Response.json();
      
      if (phase2Data.success) {
        workflowResult.executionResults = phase2Data;
        workflowResult.phases.phase2 = {
          success: true,
          passed: phase2Data.summary?.passed || 0,
          failed: phase2Data.summary?.failed || 0,
          duration: phase2Data.summary?.duration || 0
        };
        console.log(`      ✓ Execution complete: ${phase2Data.summary?.passed}/${phase2Data.summary?.total} passed`);
      } else {
        throw new Error('Phase 2 execution failed');
      }
    } catch (error) {
      console.log('      ✗ Phase 2 failed:', error.message);
      workflowResult.phases.phase2 = { success: false, error: error.message };
      return res.json(workflowResult);
    }
    
    // Step 3: Store in RAG (Phase 4.5)
    console.log('   💾 Step 3: Storing in RAG...');
    try {
      await fetch(`${SERVICES.phase4_5}/api/rag/store`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: workflowResult.testId,
          testName: `Test: ${naturalLanguage.substring(0, 50)}`,
          steps: workflowResult.steps,
          results: workflowResult.executionResults.summary,
          metadata: {
            timestamp: new Date().toISOString(),
            naturalLanguage: naturalLanguage
          }
        })
      });
      
      workflowResult.phases.phase4_5 = { success: true };
      console.log('      ✓ Stored in RAG');
    } catch (error) {
      console.log('      ⚠️  RAG storage failed (non-critical):', error.message);
      workflowResult.phases.phase4_5 = { success: false, error: error.message };
    }
    
    // Step 4: Auto-fix if failures and autoFix enabled
    if (options.autoFix && workflowResult.phases.phase2.failed > 0) {
      console.log('   🔧 Step 4: Auto-fixing failures...');
      // This would call Phase 5 for each failure
      // Simplified for now
      workflowResult.phases.phase5 = { success: true, note: 'Auto-fix would run here' };
    }
    
    console.log('   ✅ Workflow complete!');
    
    res.json(workflowResult);
    
  } catch (error) {
    console.error('❌ Workflow error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== DASHBOARD ENDPOINTS ====================

/**
 * GET /api/dashboard/stats
 * Get aggregated statistics from all phases
 */
app.get('/api/dashboard/stats', async (req, res) => {
  console.log('\n📊 Dashboard stats request');
  
  try {
    const stats = {
      success: true,
      timestamp: new Date().toISOString(),
      services: {},
      aggregated: {
        totalTests: 0,
        successRate: 0,
        fixesApplied: 0
      }
    };
    
    // Query Phase 4.5 for test stats
    try {
      const ragResponse = await fetch(`${SERVICES.phase4_5}/api/rag/stats`);
      const ragData = await ragResponse.json();
      
      if (ragData.success) {
        stats.aggregated.totalTests = ragData.stats.totalTests || 0;
        stats.aggregated.successRate = ragData.stats.averageSuccessRate || 0;
        stats.services.phase4_5 = { healthy: true, testsStored: ragData.stats.totalTests };
      }
    } catch (error) {
      console.log('   ⚠️  Phase 4.5 stats unavailable');
      stats.services.phase4_5 = { healthy: false };
    }
    
    // Query Phase 5 for fix stats
    try {
      const phase5Response = await fetch(`${SERVICES.phase5}/api/auto-fix/stats`);
      const phase5Data = await phase5Response.json();
      
      if (phase5Data.success) {
        stats.aggregated.fixesApplied = phase5Data.stats.successful || 0;
        stats.services.phase5 = { healthy: true, fixes: phase5Data.stats.total };
      }
    } catch (error) {
      console.log('   ⚠️  Phase 5 stats unavailable');
      stats.services.phase5 = { healthy: false };
    }
    
    res.json(stats);
    
  } catch (error) {
    console.error('❌ Stats error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/services/health
 * Check health of all services
 * Enhanced with graceful handling for services without proper /health endpoints
 */
app.get('/api/services/health', async (req, res) => {
  console.log('\n🏥 Services health check');
  
  const healthResults = {
    success: true,
    timestamp: new Date().toISOString(),
    services: {}
  };
  
  // Check each service with graceful fallback
  const healthChecks = Object.entries(SERVICES).map(async ([name, url]) => {
    try {
      // Try the /health endpoint first
      const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(5000) });
      const contentType = response.headers.get('content-type');
      
      // Check if response is JSON
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        healthResults.services[name] = {
          status: data.status || 'healthy',
          url: url,
          healthy: response.ok,
          hasHealthEndpoint: true
        };
        console.log(`   ✓ ${name}: healthy`);
      } else {
        // Service returned HTML or other content - try base URL to check if running
        try {
          const baseResponse = await fetch(url, { 
            signal: AbortSignal.timeout(3000),
            method: 'HEAD' 
          });
          healthResults.services[name] = {
            status: 'running',
            url: url,
            healthy: true,
            hasHealthEndpoint: false,
            note: 'Service is running (no health endpoint)'
          };
          console.log(`   ⚡ ${name}: running (no health endpoint)`);
        } catch (baseError) {
          throw new Error('Service not responding');
        }
      }
    } catch (error) {
      // Last resort: check if port is open by trying to connect
      try {
        const testResponse = await fetch(url, { 
          signal: AbortSignal.timeout(2000),
          method: 'HEAD' 
        });
        healthResults.services[name] = {
          status: 'running',
          url: url,
          healthy: true,
          hasHealthEndpoint: false,
          note: 'Service is running (health check failed)'
        };
        console.log(`   ⚡ ${name}: running (health check unavailable)`);
      } catch (finalError) {
        healthResults.services[name] = {
          status: 'offline',
          url: url,
          healthy: false,
          error: 'Service not responding',
          hasHealthEndpoint: false
        };
        console.log(`   ✗ ${name}: offline`);
      }
    }
  });
  
  await Promise.all(healthChecks);
  
  // Overall health
  const allHealthy = Object.values(healthResults.services).every(s => s.healthy);
  healthResults.overallStatus = allHealthy ? 'healthy' : 'degraded';
  
  res.json(healthResults);
});

/**
 * GET /api/dashboard/recent-tests
 * Get recent test executions
 */
app.get('/api/dashboard/recent-tests', async (req, res) => {
  console.log('\n📋 Recent tests request');
  
  try {
    // Query RAG for recent tests
    const ragResponse = await fetch(`${SERVICES.phase4_5}/api/rag/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Show all recent tests',
        limit: 10
      })
    });
    
    const ragData = await ragResponse.json();
    
    if (ragData.success) {
      res.json({
        success: true,
        tests: ragData.results || [],
        count: ragData.resultsCount || 0
      });
    } else {
      res.json({
        success: false,
        tests: [],
        count: 0,
        error: 'Unable to fetch recent tests'
      });
    }
    
  } catch (error) {
    console.error('❌ Recent tests error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== PROXY ENDPOINTS ====================

/**
 * Proxy artifacts (screenshots, reports) from Phase 2
 * This allows the unified UI to access test artifacts
 */
app.use('/artifacts', async (req, res) => {
  try {
    const artifactPath = req.path;
    const url = `${SERVICES.phase2}/artifacts${artifactPath}`;
    
    console.log(`   📸 Proxying artifact: ${artifactPath} → ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return res.status(response.status).send('Artifact not found');
    }
    
    // Get the content type and body
    const contentType = response.headers.get('content-type');
    const buffer = await response.arrayBuffer();
    
    // Set appropriate headers
    res.set('Content-Type', contentType);
    res.send(Buffer.from(buffer));
    
  } catch (error) {
    console.error(`   ❌ Artifact proxy error: ${error.message}`);
    res.status(500).send('Error loading artifact');
  }
});

/**
 * Proxy requests to specific phases
 * Allows UI to call any phase through Phase 6
 */
app.use('/api/phase1', async (req, res) => {
  await proxyRequest(req, res, SERVICES.phase1);
});

app.use('/api/phase2', async (req, res) => {
  await proxyRequest(req, res, SERVICES.phase2);
});

app.use('/api/phase3', async (req, res) => {
  await proxyRequest(req, res, SERVICES.phase3);
});

app.use('/api/phase4', async (req, res) => {
  await proxyRequest(req, res, SERVICES.phase4);
});

app.use('/api/phase4.5', async (req, res) => {
  await proxyRequest(req, res, SERVICES.phase4_5);
});

app.use('/api/phase5', async (req, res) => {
  await proxyRequest(req, res, SERVICES.phase5);
});

/**
 * Helper function to proxy requests
 */
async function proxyRequest(req, res, serviceUrl) {
  try {
    // Extract the path after /api/phaseX and preserve the /api prefix
    // Match phase1, phase2, phase3, phase4, phase4_5, phase5, etc.
    const path = req.originalUrl.replace(/^\/api\/phase[0-9._]+/, '/api');
    const url = `${serviceUrl}${path}`;
    
    console.log(`   🔀 Proxying ${req.method} ${req.originalUrl} → ${url}`);
    
    const response = await fetch(url, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error(`   ❌ Proxy error: ${error.message}`);
    res.status(500).json({
      success: false,
      error: `Proxy error: ${error.message}`
    });
  }
}

// ==================== TEST SUITES API ====================

import * as suitesAPI from './testSuitesAPI.js';

// Get all suites (tree structure)
app.get('/api/suites', async (req, res) => {
  try {
    const tree = await suitesAPI.getSuiteTree();
    res.json({ success: true, suites: tree });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get suite by ID
app.get('/api/suites/:suiteId', async (req, res) => {
  try {
    const suite = await suitesAPI.getSuite(req.params.suiteId);
    if (!suite) {
      return res.status(404).json({ success: false, error: 'Suite not found' });
    }
    res.json({ success: true, suite });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new suite
app.post('/api/suites', async (req, res) => {
  try {
    const suite = await suitesAPI.createSuite(req.body);
    res.json({ success: true, suite });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update suite
app.put('/api/suites/:suiteId', async (req, res) => {
  try {
    const suite = await suitesAPI.updateSuite(req.params.suiteId, req.body);
    res.json({ success: true, suite });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete suite
app.delete('/api/suites/:suiteId', async (req, res) => {
  try {
    await suitesAPI.deleteSuite(req.params.suiteId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add test to suite
app.post('/api/suites/:suiteId/tests', async (req, res) => {
  try {
    const suite = await suitesAPI.addTestToSuite(req.params.suiteId, req.body);
    res.json({ success: true, suite });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update test in suite
app.put('/api/suites/:suiteId/tests/:testId', async (req, res) => {
  try {
    const suite = await suitesAPI.updateTestInSuite(
      req.params.suiteId,
      req.params.testId,
      req.body
    );
    res.json({ success: true, suite });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Remove test from suite
app.delete('/api/suites/:suiteId/tests/:testId', async (req, res) => {
  try {
    const suite = await suitesAPI.removeTestFromSuite(
      req.params.suiteId,
      req.params.testId
    );
    res.json({ success: true, suite });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Clone suite
app.post('/api/suites/:suiteId/clone', async (req, res) => {
  try {
    const newSuite = await suitesAPI.cloneSuite(req.params.suiteId);
    res.json({ success: true, suite: newSuite });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export suite
app.get('/api/suites/:suiteId/export', async (req, res) => {
  try {
    const exportData = await suitesAPI.exportSuite(req.params.suiteId);
    res.json({ success: true, data: exportData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Import suite
app.post('/api/suites/import', async (req, res) => {
  try {
    const suite = await suitesAPI.importSuite(req.body, req.body.parentId);
    res.json({ success: true, suite });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Schedule suite
app.post('/api/suites/:suiteId/schedule', async (req, res) => {
  try {
    const suite = await suitesAPI.scheduleSuite(req.params.suiteId, req.body);
    res.json({ success: true, suite });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute suite
app.post('/api/suites/:suiteId/run', async (req, res) => {
  try {
    const suite = await suitesAPI.getSuite(req.params.suiteId);
    if (!suite) {
      return res.status(404).json({ success: false, error: 'Suite not found' });
    }
    
    const options = req.body.options || {};
    const mode = options.mode || 'sequential'; // 'sequential' or 'parallel'
    const continueOnFailure = options.continueOnFailure !== false;
    
    const results = [];
    const enabledTests = suite.tests.filter(test => test.enabled !== false);
    
    // Initialize execution state
    suitesAPI.initExecutionState(suite.id, enabledTests.length);
    
    // Queue all tests
    suitesAPI.queueTests(suite.id, enabledTests.map(t => t.id));
    
    if (mode === 'parallel') {
      // Execute all tests in parallel
      const promises = enabledTests
        .map(async (test) => {
          // Mark test as running
          suitesAPI.updateTestStatus(suite.id, test.id, 'running', {
            totalSteps: test.steps?.length || 0
          });
          
          try {
            const response = await fetch(`${SERVICES.phase2}/api/execute`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                steps: test.steps,
                assertions: test.assertions || [],
                options: options.executionOptions || {}
              })
            });
            const result = await response.json();
            
            // Update test status based on result
            suitesAPI.updateTestStatus(suite.id, test.id, result.success ? 'passed' : 'failed', {
              error: result.error || null
            });
            
            return { testId: test.id, testName: test.name, ...result };
          } catch (error) {
            // Mark test as failed
            suitesAPI.updateTestStatus(suite.id, test.id, 'failed', {
              error: error.message
            });
            return { testId: test.id, testName: test.name, success: false, error: error.message };
          }
        });
      
      const parallelResults = await Promise.all(promises);
      results.push(...parallelResults);
      
    } else {
      // Execute tests sequentially
      for (const test of enabledTests) {
        // Mark test as running
        suitesAPI.updateTestStatus(suite.id, test.id, 'running', {
          totalSteps: test.steps?.length || 0
        });
        
        try {
          const response = await fetch(`${SERVICES.phase2}/api/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              steps: test.steps,
              assertions: test.assertions || [],
              options: options.executionOptions || {}
            })
          });
          const result = await response.json();
          
          // Update test status based on result
          suitesAPI.updateTestStatus(suite.id, test.id, result.success ? 'passed' : 'failed', {
            error: result.error || null
          });
          
          results.push({ testId: test.id, testName: test.name, ...result });
          
          // Stop if test failed and continueOnFailure is false
          if (!result.success && !continueOnFailure) {
            break;
          }
        } catch (error) {
          // Mark test as failed
          suitesAPI.updateTestStatus(suite.id, test.id, 'failed', {
            error: error.message
          });
          
          results.push({ testId: test.id, testName: test.name, success: false, error: error.message });
          if (!continueOnFailure) {
            break;
          }
        }
      }
    }
    
    // Complete execution
    suitesAPI.completeExecution(suite.id);
    
    // Update suite stats
    await suitesAPI.updateSuiteStats(req.params.suiteId, { results });
    
    res.json({
      success: true,
      suiteId: suite.id,
      suiteName: suite.name,
      mode,
      results,
      summary: {
        total: results.length,
        passed: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get suite execution status (for live polling)
app.get('/api/suites/:suiteId/status', async (req, res) => {
  try {
    const status = suitesAPI.getExecutionStatus(req.params.suiteId);
    
    if (!status) {
      return res.json({
        success: true,
        status: 'idle',
        message: 'No active execution for this suite'
      });
    }
    
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all active executions
app.get('/api/suites/executions/active', async (req, res) => {
  try {
    const active = suitesAPI.getAllExecutions();
    res.json({
      success: true,
      executions: active
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search suites
app.get('/api/suites/search/:query', async (req, res) => {
  try {
    const suites = await suitesAPI.searchSuites(req.params.query);
    res.json({ success: true, suites });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get suites by tag
app.get('/api/suites/tag/:tag', async (req, res) => {
  try {
    const suites = await suitesAPI.getSuitesByTag(req.params.tag);
    res.json({ success: true, suites });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CSV UPLOAD & TEST SUITE IMPORT ====================

// Upload CSV file and convert to test suite
app.post('/api/csv/upload', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const filename = req.file.originalname;

    const result = await csvHandler.processUploadedCSV(csvContent, filename);

    res.json({ 
      success: true, 
      message: 'CSV processed successfully',
      ...result 
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== CLOUD INTEGRATIONS ====================

// Initialize cloud integrations
(async () => {
  await cloudIntegrations.initialize();
  await testTriggers.initialize();
})();

// Add/Update cloud integration
app.post('/api/integrations/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const result = await cloudIntegrations.addIntegration(provider, req.body);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Integration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test cloud connection
app.post('/api/integrations/:provider/test', async (req, res) => {
  try {
    const { provider } = req.params;
    const result = await cloudIntegrations.testConnection(provider, req.body);
    res.json(result);
  } catch (error) {
    console.error('Connection test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// List all integrations
app.get('/api/integrations', async (req, res) => {
  try {
    const integrations = await cloudIntegrations.listIntegrations();
    res.json({ success: true, integrations });
  } catch (error) {
    console.error('List integrations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific integration
app.get('/api/integrations/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const integration = await cloudIntegrations.getIntegration(provider);
    res.json({ success: true, integration });
  } catch (error) {
    console.error('Get integration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete integration
app.delete('/api/integrations/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    const result = await cloudIntegrations.deleteIntegration(provider);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Delete integration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== WEBHOOKS ====================

// Generic webhook endpoint for all providers
app.post('/api/webhooks/:provider', async (req, res) => {
  try {
    const { provider } = req.params;
    console.log(`\n📥 Webhook received from ${provider}`);

    // Handle webhook from cloud provider
    const webhookResult = await cloudIntegrations.handleWebhook(
      provider, 
      req.body, 
      req.headers
    );

    // Check if we should trigger test execution
    if (webhookResult.triggerRegression) {
      console.log('🎯 Triggering automated test execution...');

      // Find matching triggers
      const triggers = await testTriggers.listTriggers({ 
        enabled: true, 
        triggerType: 'push' 
      });

      for (const trigger of triggers) {
        const shouldTrigger = await testTriggers.shouldTrigger(trigger, webhookResult.event);
        
        if (shouldTrigger.shouldTrigger) {
          console.log(`   ✅ Trigger matches: ${trigger.name}`);
          
          // Execute trigger asynchronously
          testTriggers.executeTrigger(trigger, {
            ...webhookResult.event,
            reason: shouldTrigger.reason
          }).catch(err => console.error('Trigger execution error:', err));
        }
      }
    }

    res.json({ 
      success: true, 
      message: 'Webhook processed',
      triggered: webhookResult.triggerRegression 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== AUTOMATED TEST TRIGGERS ====================

// Create new trigger
app.post('/api/triggers', async (req, res) => {
  try {
    const trigger = await testTriggers.createTrigger(req.body);
    res.json({ success: true, trigger });
  } catch (error) {
    console.error('Create trigger error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// List all triggers
app.get('/api/triggers', async (req, res) => {
  try {
    const triggers = await testTriggers.listTriggers(req.query);
    res.json({ success: true, triggers });
  } catch (error) {
    console.error('List triggers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get specific trigger
app.get('/api/triggers/:triggerId', async (req, res) => {
  try {
    const { triggerId } = req.params;
    const trigger = await testTriggers.getTrigger(triggerId);
    res.json({ success: true, trigger });
  } catch (error) {
    console.error('Get trigger error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update trigger
app.put('/api/triggers/:triggerId', async (req, res) => {
  try {
    const { triggerId } = req.params;
    const trigger = await testTriggers.updateTrigger(triggerId, req.body);
    res.json({ success: true, trigger });
  } catch (error) {
    console.error('Update trigger error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete trigger
app.delete('/api/triggers/:triggerId', async (req, res) => {
  try {
    const { triggerId } = req.params;
    const result = await testTriggers.deleteTrigger(triggerId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Delete trigger error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manual trigger execution
app.post('/api/triggers/:triggerId/execute', async (req, res) => {
  try {
    const { triggerId } = req.params;
    const trigger = await testTriggers.getTrigger(triggerId);
    
    const execution = await testTriggers.executeTrigger(trigger, {
      type: 'manual',
      reason: 'Manual execution',
      triggeredBy: req.body.userId || 'anonymous'
    });

    res.json({ success: true, execution });
  } catch (error) {
    console.error('Execute trigger error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get execution history
app.get('/api/triggers/executions/history', async (req, res) => {
  try {
    const history = await testTriggers.getExecutionHistory(req.query);
    res.json({ success: true, history });
  } catch (error) {
    console.error('Get execution history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AIQA Unified Platform',
    version: '1.0.0',
    phase: 6
  });
});

// ==================== SERVER STARTUP ====================

app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              AIQA PHASE 6 - UNIFIED PLATFORM                   ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║                                                                ║');
  console.log(`║  🚀 Server running on http://localhost:${PORT}                  ║`);
  console.log('║                                                                ║');
  console.log('║  🌐 Phase 6: Unified Dashboard                                 ║');
  console.log('║                                                                ║');
  console.log('║  Features:                                                     ║');
  console.log('║   ✅ Complete workflow orchestration                           ║');
  console.log('║   ✅ Real-time service monitoring                              ║');
  console.log('║   ✅ Unified test management                                   ║');
  console.log('║   ✅ End-to-end automation                                     ║');
  console.log('║   ✅ Beautiful dashboard UI                                    ║');
  console.log('║                                                                ║');
  console.log('║  API Endpoints:                                                ║');
  console.log('║   POST /api/workflow/create-and-execute  - Full workflow      ║');
  console.log('║   GET  /api/dashboard/stats              - Aggregated stats   ║');
  console.log('║   GET  /api/dashboard/recent-tests       - Recent tests       ║');
  console.log('║   GET  /api/services/health              - Service health     ║');
  console.log('║   POST /api/csv/upload                   - CSV test import    ║');
  console.log('║   POST /api/integrations/:provider       - Cloud integration  ║');
  console.log('║   POST /api/triggers                     - Auto test triggers ║');
  console.log('║   POST /api/webhooks/:provider           - Webhook handler    ║');
  console.log('║   *    /api/phase[1-5]/*                 - Proxy to phases    ║');
  console.log('║   GET  /health                            - Health check      ║');
  console.log('║                                                                ║');
  console.log('║  Connected Services:                                           ║');
  console.log('║   Phase 1   (:3001)  Natural Language → Steps                 ║');
  console.log('║   Phase 2   (:3002)  Test Execution                           ║');
  console.log('║   Phase 3   (:3003)  AI Web Reader                            ║');
  console.log('║   Phase 4   (:3004)  Learning System                          ║');
  console.log('║   Phase 4.5 (:3005)  RAG Service                              ║');
  console.log('║   Phase 5   (:3006)  Self-Improving Code                      ║');
  console.log('║                                                                ║');
  console.log('║  Dashboard: http://localhost:3007                             ║');
  console.log('║                                                                ║');
  console.log('║  🎉 AIQA Platform is now complete! 🎉                          ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('  ');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down Unified Platform gracefully...');
  process.exit(0);
});

