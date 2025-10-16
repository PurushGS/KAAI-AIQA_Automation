/**
 * AIQA Phase 4.5: RAG Service Server
 * 
 * @author Purushothama Raju
 * @date 12/10/2025
 * @copyright Copyright © 2025 Purushothama Raju
 * 
 * PURPOSE:
 * Express server providing RAG (Retrieval-Augmented Generation) capabilities.
 * This is the central knowledge service that all other phases query for context.
 * 
 * KEY FEATURES:
 * 1. Store test executions in vector database
 * 2. Query knowledge base with natural language
 * 3. Find similar tests
 * 4. Analyze git changes and recommend tests
 * 5. Git webhook integration
 * 6. Database statistics
 * 
 * API ENDPOINTS:
 * POST /api/rag/store          - Store test execution
 * POST /api/rag/query          - Query knowledge base
 * GET  /api/rag/similar/:id    - Find similar tests
 * POST /api/rag/git-analyze    - Analyze git changes
 * POST /api/rag/git-webhook    - GitHub webhook handler
 * GET  /api/rag/stats          - Database statistics
 * 
 * CONNECTIONS:
 * - All phases (1-4) call this service
 * - Git webhooks trigger this service
 * - Phase 6 UI displays RAG insights
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { RAGEngine } from './ragEngine.js';
import { GitWatcher } from './gitWatcher.js';

// Load environment variables
dotenv.config({ path: '../.env' });

const app = express();
const PORT = 3005;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for large test data
app.use(express.static('.')); // Serve static files (index.html)

// Initialize RAG Engine and Git Watcher
let ragEngine;
let gitWatcher;

/**
 * Initialize services
 */
async function initializeServices() {
  console.log('🚀 Initializing AIQA Phase 4.5 services...\n');
  
  try {
    // Initialize RAG Engine
    ragEngine = new RAGEngine();
    await ragEngine.initialize();
    console.log('');
    
    // Initialize Git Watcher
    gitWatcher = new GitWatcher(ragEngine);
    console.log('👀 Git Watcher initialized\n');
    
    return true;
  } catch (error) {
    console.error('❌ Service initialization failed:', error.message);
    console.error('   Make sure ChromaDB is accessible and OpenAI API key is set');
    return false;
  }
}

// ==================== API ENDPOINTS ====================

/**
 * POST /api/rag/store
 * Store a test execution in the knowledge base
 */
app.post('/api/rag/store', async (req, res) => {
  console.log('\n📥 Store request received');
  
  try {
    const testExecution = req.body;
    
    // Validate required fields
    if (!testExecution.testId) {
      return res.status(400).json({
        success: false,
        error: 'testId is required'
      });
    }
    
    // Store in RAG
    const result = await ragEngine.storeExecution(testExecution);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Storage error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/rag/query
 * Query the knowledge base with natural language
 */
app.post('/api/rag/query', async (req, res) => {
  console.log('\n📥 Query request received');
  
  try {
    const { query, filters = {}, limit = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'query is required'
      });
    }
    
    // Query RAG
    const result = await ragEngine.query(query, filters, limit);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Query error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/rag/similar/:testId
 * Find tests similar to a given test
 */
app.get('/api/rag/similar/:testId', async (req, res) => {
  console.log('\n📥 Similar tests request');
  
  try {
    const { testId } = req.params;
    const limit = parseInt(req.query.limit) || 5;
    
    const result = await ragEngine.findSimilarTests(testId, limit);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Similar tests error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/rag/git-analyze
 * Analyze git changes and recommend tests
 */
app.post('/api/rag/git-analyze', async (req, res) => {
  console.log('\n📥 Git analysis request');
  
  try {
    const gitChange = req.body;
    
    // Validate
    if (!gitChange.changedFiles || gitChange.changedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'changedFiles array is required'
      });
    }
    
    // Analyze with RAG
    const result = await ragEngine.analyzeGitChange(gitChange);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Git analysis error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/rag/git-webhook
 * Handle GitHub webhook events
 */
app.post('/api/rag/git-webhook', async (req, res) => {
  console.log('\n📥 GitHub webhook received');
  
  try {
    const payload = req.body;
    
    // Process webhook
    const result = await gitWatcher.processGitHubWebhook(payload);
    
    // Auto-trigger tests if configured
    if (result.success && result.results.length > 0) {
      const triggerResults = [];
      
      for (const commitResult of result.results) {
        if (commitResult.analysis.recommendedTests?.length > 0) {
          const triggered = await gitWatcher.triggerTests(commitResult.analysis);
          triggerResults.push(triggered);
        }
      }
      
      result.testsTriggered = triggerResults;
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Webhook error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/rag/git-watch
 * Add a repository to watch
 */
app.post('/api/rag/git-watch', async (req, res) => {
  console.log('\n📥 Watch repository request');
  
  try {
    const { repoPath, config } = req.body;
    
    if (!repoPath) {
      return res.status(400).json({
        success: false,
        error: 'repoPath is required'
      });
    }
    
    await gitWatcher.watchRepository(repoPath, config);
    
    res.json({
      success: true,
      message: `Now watching ${repoPath}`,
      watchedRepos: gitWatcher.getWatchedRepos()
    });
    
  } catch (error) {
    console.error('❌ Watch error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/rag/git-analyze-commit
 * Analyze a specific commit in a watched repo
 */
app.post('/api/rag/git-analyze-commit', async (req, res) => {
  console.log('\n📥 Commit analysis request');
  
  try {
    const { repoPath, commitHash = 'HEAD' } = req.body;
    
    if (!repoPath) {
      return res.status(400).json({
        success: false,
        error: 'repoPath is required'
      });
    }
    
    const result = await gitWatcher.analyzeCommit(repoPath, commitHash);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Commit analysis error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/rag/stats
 * Get RAG database statistics
 */
app.get('/api/rag/stats', async (req, res) => {
  console.log('\n📥 Stats request');
  
  try {
    const result = await ragEngine.getStats();
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Stats error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/rag/watched-repos
 * Get list of watched repositories
 */
app.get('/api/rag/watched-repos', (req, res) => {
  console.log('\n📥 Watched repos request');
  
  try {
    const repos = gitWatcher.getWatchedRepos();
    
    res.json({
      success: true,
      count: repos.length,
      repos: repos
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
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
app.get('/health', async (req, res) => {
  try {
    const stats = await ragEngine.getStats();
    
    res.json({
      status: 'healthy',
      service: 'RAG Service',
      version: '1.0.0',
      testsInDatabase: stats.stats.totalTests
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// ==================== SERVER STARTUP ====================

/**
 * Start the server
 */
async function startServer() {
  // Initialize services first
  const initialized = await initializeServices();
  
  if (!initialized) {
    console.error('\n❌ Cannot start server - service initialization failed');
    console.error('   Please check your configuration and try again\n');
    process.exit(1);
  }
  
  // Start Express server
  app.listen(PORT, () => {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                  AIQA PHASE 4.5 - RAG SERVER                   ║');
    console.log('╠════════════════════════════════════════════════════════════════╣');
    console.log('║                                                                ║');
    console.log(`║  🚀 Server running on http://localhost:${PORT}                  ║`);
    console.log('║                                                                ║');
    console.log('║  🧠 Phase 4.5: RAG Service (Knowledge Base)                    ║');
    console.log('║                                                                ║');
    console.log('║  Features:                                                     ║');
    console.log('║   ✅ Vector database (ChromaDB)                                ║');
    console.log('║   ✅ Semantic search                                           ║');
    console.log('║   ✅ Test execution storage                                    ║');
    console.log('║   ✅ Git integration                                           ║');
    console.log('║   ✅ Auto-test triggering                                      ║');
    console.log('║                                                                ║');
    console.log('║  API Endpoints:                                                ║');
    console.log('║   POST /api/rag/store              - Store test               ║');
    console.log('║   POST /api/rag/query              - Query knowledge base     ║');
    console.log('║   GET  /api/rag/similar/:id        - Find similar tests      ║');
    console.log('║   POST /api/rag/git-analyze        - Analyze git changes     ║');
    console.log('║   POST /api/rag/git-webhook        - GitHub webhook          ║');
    console.log('║   POST /api/rag/git-watch          - Watch repository        ║');
    console.log('║   POST /api/rag/git-analyze-commit - Analyze commit          ║');
    console.log('║   GET  /api/rag/stats              - Database stats          ║');
    console.log('║   GET  /api/rag/watched-repos      - List watched repos      ║');
    console.log('║   GET  /health                     - Health check            ║');
    console.log('║                                                                ║');
    console.log('║  Integration:                                                  ║');
    console.log('║   → All phases query this service                             ║');
    console.log('║   → Git webhooks trigger this service                         ║');
    console.log('║   → Stores all test execution history                         ║');
    console.log('║                                                                ║');
    console.log('║  Web UI: http://localhost:3005                                ║');
    console.log('║                                                                ║');
    console.log('║  Next: Test RAG capabilities, then move to Phase 5            ║');
    console.log('║                                                                ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('  ');
  });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down RAG Service gracefully...');
  process.exit(0);
});

// Start the server
startServer().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

