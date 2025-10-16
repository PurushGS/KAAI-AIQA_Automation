/**
 * Phase 4 Server
 * 
 * @author Purushothama Raju
 * @date 12/10/2025
 * @copyright Copyright © 2025 Purushothama Raju
 * 
 * PURPOSE:
 * Collect user feedback, analyze errors, and display learnings
 * 
 * CONNECTIONS:
 * - Receives: Test results from Phase 2
 * - Uses: learningEngine.js for analysis
 * - Provides: Feedback UI and insights dashboard
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import LearningEngine from './learningEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3004;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize learning engine
const learningEngine = new LearningEngine();

/**
 * API: Submit user feedback
 * 
 * ENDPOINT: POST /api/feedback
 * INPUT: { testId, ratings, feedback text }
 * OUTPUT: { feedbackId, learnings }
 */
app.post('/api/feedback', async (req, res) => {
  try {
    const feedback = req.body;
    
    if (!feedback.testId) {
      return res.status(400).json({
        success: false,
        error: 'Missing testId'
      });
    }
    
    console.log('\n📝 Received user feedback');
    console.log(`   Test ID: ${feedback.testId}`);
    console.log(`   Rating: ${feedback.overallRating}/5`);
    
    const result = await learningEngine.collectFeedback(
      feedback.testId,
      feedback
    );
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Feedback error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * API: Analyze test errors
 * 
 * ENDPOINT: POST /api/analyze-errors
 * INPUT: { testReport from Phase 2 }
 * OUTPUT: { learnings, patterns, recommendations }
 */
app.post('/api/analyze-errors', async (req, res) => {
  try {
    const { testReport } = req.body;
    
    if (!testReport) {
      return res.status(400).json({
        success: false,
        error: 'Missing testReport'
      });
    }
    
    console.log('\n🔍 Analyzing test errors');
    console.log(`   Test ID: ${testReport.testId}`);
    
    const learning = await learningEngine.analyzeErrors(testReport);
    
    res.json({
      success: true,
      learning: learning
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * API: Get recent learnings
 * 
 * ENDPOINT: GET /api/learnings?limit=10
 * OUTPUT: Array of recent learnings
 */
app.get('/api/learnings', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const learnings = await learningEngine.getRecentLearnings(limit);
    
    res.json({
      success: true,
      learnings: learnings,
      count: learnings.length
    });
    
  } catch (error) {
    console.error('Learnings error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * API: Get insights summary
 * 
 * ENDPOINT: GET /api/insights
 * OUTPUT: Aggregated insights and patterns
 */
app.get('/api/insights', async (req, res) => {
  try {
    const summary = await learningEngine.getInsightsSummary();
    
    res.json({
      success: true,
      summary: summary
    });
    
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    phase: 4,
    description: 'Learning System',
    timestamp: new Date().toISOString()
  });
});

/**
 * Serve UI
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  AIQA PHASE 4 - TEST SERVER                    ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  🚀 Server running on http://localhost:${PORT}                  ║
║                                                                ║
║  🧠 Phase 4: Learning System                                   ║
║                                                                ║
║  Features:                                                     ║
║   ✅ User feedback collection                                  ║
║   ✅ Error pattern analysis                                    ║
║   ✅ AI-powered insights                                       ║
║   ✅ Knowledge base storage                                    ║
║   ✅ Recommendations engine                                    ║
║                                                                ║
║  Capabilities:                                                 ║
║   • Learn from test failures                                  ║
║   • Identify recurring patterns                               ║
║   • Provide actionable recommendations                        ║
║   • Improve over time with ML                                 ║
║                                                                ║
║  API Endpoints:                                                ║
║   POST /api/feedback        - Submit feedback                 ║
║   POST /api/analyze-errors  - Analyze test errors            ║
║   GET  /api/learnings       - View recent learnings          ║
║   GET  /api/insights        - Get insights summary           ║
║                                                                ║
║  Integration:                                                  ║
║   → Learns from Phase 2 test results                          ║
║   → Provides feedback to all phases                           ║
║   → Continuously improves accuracy                            ║
║                                                                ║
║  Next: Test this phase before moving to Phase 5               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

export default app;

