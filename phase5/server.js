/**
 * AIQA Phase 5: Self-Improving Code Server
 * 
 * PURPOSE:
 * Express server providing self-improvement capabilities.
 * Automatically detects and fixes code issues using ML and AI.
 * 
 * KEY FEATURES:
 * 1. Error analysis from test failures
 * 2. AI-powered code patch generation
 * 3. Safe patch application with rollback
 * 4. Integration with RAG for learning
 * 5. Fix history and statistics
 * 
 * API ENDPOINTS:
 * POST /api/auto-fix/analyze        - Analyze test failure
 * POST /api/auto-fix/generate       - Generate code patch
 * POST /api/auto-fix/apply          - Apply patch
 * POST /api/auto-fix/rollback       - Rollback patch
 * GET  /api/auto-fix/history        - View fix history
 * GET  /api/auto-fix/stats          - Get statistics
 * GET  /health                       - Health check
 * 
 * CONNECTIONS:
 * - Phase 2: Receives test failure notifications
 * - Phase 4.5: Queries RAG for similar fixes
 * - Phase 6: Provides fix summaries to UI
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ErrorAnalyzer } from './errorAnalyzer.js';
import { CodeGenerator } from './codeGenerator.js';
import { PatchApplier } from './patchApplier.js';

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();
const PORT = 3006;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.')); // Serve static files (index.html)

// Initialize services
const errorAnalyzer = new ErrorAnalyzer();
const codeGenerator = new CodeGenerator();
const patchApplier = new PatchApplier();

console.log('🚀 Initializing AIQA Phase 5 services...\n');

// ==================== API ENDPOINTS ====================

/**
 * POST /api/auto-fix/analyze
 * Analyze a test failure
 */
app.post('/api/auto-fix/analyze', async (req, res) => {
  console.log('\n📥 Analyze request received');
  
  try {
    const testFailure = req.body;
    
    // Validate input
    if (!testFailure.testId || !testFailure.errorMessage) {
      return res.status(400).json({
        success: false,
        error: 'testId and errorMessage are required'
      });
    }
    
    // Analyze error
    const analysis = await errorAnalyzer.analyze(testFailure);
    
    res.json(analysis);
    
  } catch (error) {
    console.error('❌ Analysis error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auto-fix/generate
 * Generate a code patch for an issue
 */
app.post('/api/auto-fix/generate', async (req, res) => {
  console.log('\n📥 Generate patch request received');
  
  try {
    const { analysis, file } = req.body;
    
    // Validate input
    if (!analysis || !file) {
      return res.status(400).json({
        success: false,
        error: 'analysis and file are required'
      });
    }
    
    // Generate patch
    const patch = await codeGenerator.generatePatch(analysis, file);
    
    res.json(patch);
    
  } catch (error) {
    console.error('❌ Generation error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auto-fix/apply
 * Apply a generated patch
 */
app.post('/api/auto-fix/apply', async (req, res) => {
  console.log('\n📥 Apply patch request received');
  
  try {
    const { patch, options = {} } = req.body;
    
    // Validate input
    if (!patch) {
      return res.status(400).json({
        success: false,
        error: 'patch is required'
      });
    }
    
    // Apply patch
    const result = await patchApplier.applyPatch(patch, options);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Application error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auto-fix/rollback
 * Rollback an applied patch
 */
app.post('/api/auto-fix/rollback', async (req, res) => {
  console.log('\n📥 Rollback request received');
  
  try {
    const { patchId, reason } = req.body;
    
    // Validate input
    if (!patchId) {
      return res.status(400).json({
        success: false,
        error: 'patchId is required'
      });
    }
    
    console.log(`   Reason: ${reason || 'Not specified'}`);
    
    // Rollback patch
    const result = await patchApplier.rollback(patchId);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Rollback error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auto-fix/analyze-and-fix
 * Complete workflow: analyze + generate + apply
 */
app.post('/api/auto-fix/analyze-and-fix', async (req, res) => {
  console.log('\n📥 Complete auto-fix workflow request');
  
  try {
    const { testFailure, file, options = {} } = req.body;
    
    // Validate input
    if (!testFailure || !file) {
      return res.status(400).json({
        success: false,
        error: 'testFailure and file are required'
      });
    }
    
    console.log(`   Test: ${testFailure.testId}`);
    console.log(`   File: ${file}`);
    
    // Step 1: Analyze
    console.log('   📊 Step 1: Analyzing error...');
    const analysis = await errorAnalyzer.analyze(testFailure);
    
    if (!analysis.success || !analysis.analysis.fixable) {
      return res.json({
        success: false,
        step: 'analysis',
        message: 'Error is not auto-fixable',
        analysis: analysis
      });
    }
    
    // Step 2: Generate patch
    console.log('   🔧 Step 2: Generating patch...');
    const patchResult = await codeGenerator.generatePatch(analysis.analysis, file);
    
    if (!patchResult.success) {
      return res.json({
        success: false,
        step: 'generation',
        message: 'Failed to generate patch',
        analysis: analysis,
        error: patchResult.error
      });
    }
    
    // Step 3: Apply patch (if not dry run)
    if (!options.dryRun) {
      console.log('   ✅ Step 3: Applying patch...');
      const applyResult = await patchApplier.applyPatch(patchResult.patch, options);
      
      return res.json({
        success: applyResult.success,
        step: 'complete',
        analysis: analysis,
        patch: patchResult.patch,
        application: applyResult
      });
    }
    
    // Dry run: return patch without applying
    return res.json({
      success: true,
      step: 'generation',
      dryRun: true,
      analysis: analysis,
      patch: patchResult.patch
    });
    
  } catch (error) {
    console.error('❌ Auto-fix workflow error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/auto-fix/history
 * View patch application history
 */
app.get('/api/auto-fix/history', (req, res) => {
  console.log('\n📥 History request');
  
  try {
    const filters = {
      file: req.query.file,
      success: req.query.success ? req.query.success === 'true' : undefined,
      since: req.query.since
    };
    
    const history = patchApplier.getHistory(filters);
    
    res.json({
      success: true,
      count: history.length,
      history: history
    });
    
  } catch (error) {
    console.error('❌ History error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/auto-fix/stats
 * Get fix statistics
 */
app.get('/api/auto-fix/stats', (req, res) => {
  console.log('\n📥 Stats request');
  
  try {
    const stats = patchApplier.getStats();
    
    res.json({
      success: true,
      stats: stats
    });
    
  } catch (error) {
    console.error('❌ Stats error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/auto-fix/batch-analyze
 * Analyze multiple failures at once
 */
app.post('/api/auto-fix/batch-analyze', async (req, res) => {
  console.log('\n📥 Batch analyze request');
  
  try {
    const { testFailures } = req.body;
    
    // Validate input
    if (!testFailures || !Array.isArray(testFailures)) {
      return res.status(400).json({
        success: false,
        error: 'testFailures array is required'
      });
    }
    
    console.log(`   Analyzing ${testFailures.length} failures...`);
    
    // Batch analyze
    const result = await errorAnalyzer.batchAnalyze(testFailures);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Batch analysis error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/auto-fix/backups
 * Clean old backup files
 */
app.delete('/api/auto-fix/backups', async (req, res) => {
  console.log('\n📥 Clean backups request');
  
  try {
    const keepCount = parseInt(req.query.keep) || 10;
    
    const result = await patchApplier.cleanBackups(keepCount);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Self-Improving Code Service',
    version: '1.0.0',
    components: {
      errorAnalyzer: 'ready',
      codeGenerator: 'ready',
      patchApplier: 'ready'
    }
  });
});

// ==================== SERVER STARTUP ====================

app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                  AIQA PHASE 5 - AUTO-FIX SERVER                ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log('║                                                                ║');
  console.log(`║  🚀 Server running on http://localhost:${PORT}                  ║`);
  console.log('║                                                                ║');
  console.log('║  🤖 Phase 5: Self-Improving Code                               ║');
  console.log('║                                                                ║');
  console.log('║  Features:                                                     ║');
  console.log('║   ✅ Intelligent error analysis                                ║');
  console.log('║   ✅ AI-powered code generation (GPT-4)                        ║');
  console.log('║   ✅ Safe patch application                                    ║');
  console.log('║   ✅ Automatic rollback on failure                             ║');
  console.log('║   ✅ Learning from RAG history                                 ║');
  console.log('║                                                                ║');
  console.log('║  API Endpoints:                                                ║');
  console.log('║   POST /api/auto-fix/analyze          - Analyze error         ║');
  console.log('║   POST /api/auto-fix/generate         - Generate patch        ║');
  console.log('║   POST /api/auto-fix/apply            - Apply patch           ║');
  console.log('║   POST /api/auto-fix/rollback         - Rollback              ║');
  console.log('║   POST /api/auto-fix/analyze-and-fix  - Complete workflow     ║');
  console.log('║   POST /api/auto-fix/batch-analyze    - Batch analysis        ║');
  console.log('║   GET  /api/auto-fix/history          - View history          ║');
  console.log('║   GET  /api/auto-fix/stats            - Statistics            ║');
  console.log('║   DELETE /api/auto-fix/backups        - Clean backups         ║');
  console.log('║   GET  /health                         - Health check         ║');
  console.log('║                                                                ║');
  console.log('║  Integration:                                                  ║');
  console.log('║   → Receives failures from Phase 2                            ║');
  console.log('║   → Queries RAG (Phase 4.5) for context                       ║');
  console.log('║   → Reports to Phase 6 UI                                     ║');
  console.log('║                                                                ║');
  console.log('║  Web UI: http://localhost:3006                                ║');
  console.log('║                                                                ║');
  console.log('║  Next: Test self-improvement, then move to Phase 6            ║');
  console.log('║                                                                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('  ');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down Self-Improving Code Service gracefully...');
  process.exit(0);
});

