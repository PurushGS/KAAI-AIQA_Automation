/**
 * Phase 1 Test Server
 * 
 * PURPOSE:
 * Provides a simple API and web UI to test the Natural Language → Test Steps converter
 * 
 * CONNECTIONS:
 * - Uses: converter.js (the core conversion logic)
 * - Serves: index.html (test UI)
 * - Exposes: REST API for conversion and editing
 * 
 * ARCHITECTURE:
 * Web UI → HTTP API → Converter → OpenAI → Structured Steps → Back to UI
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import NLToStepsConverter from './converter.js';

// ES Module path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
const PORT = 3001;  // Different port from main app

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));  // Serve static files from this directory

// Initialize converter
// CONNECTION: This is our core conversion engine
const converter = new NLToStepsConverter();

/**
 * API: Convert natural language to test steps
 * 
 * ENDPOINT: POST /api/convert
 * INPUT: { "naturalLanguage": "Test login flow..." }
 * OUTPUT: { "success": true, "steps": [...] }
 * 
 * PURPOSE: Main conversion endpoint
 */
app.post('/api/convert', async (req, res) => {
  try {
    const { naturalLanguage } = req.body;
    
    if (!naturalLanguage) {
      return res.status(400).json({
        success: false,
        error: 'Missing naturalLanguage in request body'
      });
    }
    
    console.log('\n📥 Received conversion request');
    
    // Call converter
    // CONNECTION: This is where we use the converter module
    const result = await converter.convert(naturalLanguage);
    
    // Return result
    res.json(result);
    
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * API: Edit a specific step
 * 
 * ENDPOINT: POST /api/edit-step
 * INPUT: { "steps": [...], "stepNumber": 2, "updates": {...} }
 * OUTPUT: { "success": true, "steps": [...] }
 * 
 * PURPOSE: Allow users to modify generated steps
 */
app.post('/api/edit-step', async (req, res) => {
  try {
    const { steps, stepNumber, updates } = req.body;
    
    if (!steps || !stepNumber || !updates) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: steps, stepNumber, updates'
      });
    }
    
    console.log(`\n✏️  Edit step ${stepNumber} request`);
    
    // Edit the step
    const updatedSteps = converter.editStep(steps, stepNumber, updates);
    
    res.json({
      success: true,
      steps: updatedSteps
    });
    
  } catch (error) {
    console.error('Edit error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * API: Add a new step
 * 
 * ENDPOINT: POST /api/add-step
 */
app.post('/api/add-step', async (req, res) => {
  try {
    const { steps, newStep, position } = req.body;
    
    if (!steps || !newStep) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: steps, newStep'
      });
    }
    
    console.log('\n➕ Add step request');
    
    const updatedSteps = converter.addStep(steps, newStep, position);
    
    res.json({
      success: true,
      steps: updatedSteps
    });
    
  } catch (error) {
    console.error('Add error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * API: Delete a step
 * 
 * ENDPOINT: POST /api/delete-step
 */
app.post('/api/delete-step', async (req, res) => {
  try {
    const { steps, stepNumber } = req.body;
    
    if (!steps || !stepNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: steps, stepNumber'
      });
    }
    
    console.log(`\n🗑️  Delete step ${stepNumber} request`);
    
    const updatedSteps = converter.deleteStep(steps, stepNumber);
    
    res.json({
      success: true,
      steps: updatedSteps
    });
    
  } catch (error) {
    console.error('Delete error:', error);
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
    phase: 1,
    description: 'Natural Language to Test Steps Converter',
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
║                  AIQA PHASE 1 - TEST SERVER                    ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  🚀 Server running on http://localhost:${PORT}                  ║
║                                                                ║
║  📝 Phase 1: Natural Language → Test Steps                     ║
║                                                                ║
║  Features:                                                     ║
║   ✅ Natural language input                                     ║
║   ✅ AI-powered conversion                                      ║
║   ✅ Step editing (add/edit/delete)                            ║
║   ✅ Real-time validation                                       ║
║                                                                ║
║  API Endpoints:                                                ║
║   POST /api/convert      - Convert NL to steps                ║
║   POST /api/edit-step    - Edit a step                        ║
║   POST /api/add-step     - Add new step                       ║
║   POST /api/delete-step  - Delete a step                      ║
║                                                                ║
║  Next: Test this phase before moving to Phase 2               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
});

export default app;

